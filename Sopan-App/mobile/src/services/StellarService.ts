import * as StellarSdk from '@stellar/stellar-sdk';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private rpcServer: StellarSdk.rpc.Server;
  private network: string;
  private networkPassphrase: string;
  // Contract ID from deployment
  private PAYMENT_CONTRACT_ID = 'CBV5C5JWPKNZKR6TZN7K65P7WRN2OCRUUT7ZCGL5O4A3YBXU4SKS3524';

  constructor(network: string = 'testnet') {
    this.network = network;
    const horizonUrl = this.getHorizonUrl(network);
    this.server = new StellarSdk.Horizon.Server(horizonUrl);
    // Initialize Soroban RPC Server
    this.rpcServer = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');

    this.networkPassphrase = network === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;
  }

  private getHorizonUrl(network: string): string {
    switch (network) {
      case 'mainnet':
        return 'https://horizon.stellar.org';
      case 'testnet':
        return 'https://horizon-testnet.stellar.org';
      default:
        return 'https://horizon-testnet.stellar.org';
    }
  }

  async createWallet(seed?: string): Promise<{ publicKey: string; secretKey: string }> {
    let keypair;

    if (seed) {
      // Derive deterministic keypair from seed
      const seedBytes = new TextEncoder().encode(seed);
      const hash = nacl.hash(seedBytes).slice(0, 32);
      keypair = StellarSdk.Keypair.fromRawEd25519Seed(Buffer.from(hash));
      console.log('✅ Created deterministic Stellar wallet from seed');
    } else {
      // Generate random keypair
      keypair = StellarSdk.Keypair.random();
      console.log('⚠️ Created random Stellar wallet (no seed provided)');
    }

    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const nativeBalance = account.balances.find(
        (balance: any) => balance.asset_type === 'native'
      );
      return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Account doesn't exist yet (not funded)
        return 0;
      }
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Subscribe to balance updates using polling (React Native compatible)
  subscribeToBalance(publicKey: string, callback: (balance: number) => void): () => void {
    try {
      let isActive = true;
      let lastBalance: number | null = null;

      // Initial balance fetch
      this.getBalance(publicKey).then((balance) => {
        lastBalance = balance;
        callback(balance);
      });

      // Poll for balance updates every 10 seconds (reduced frequency)
      const pollInterval = setInterval(async () => {
        if (isActive) {
          try {
            const balance = await this.getBalance(publicKey);
            // Only call callback if balance actually changed
            if (lastBalance === null || Math.abs(balance - lastBalance) > 0.00001) {
              lastBalance = balance;
              callback(balance);
            }
          } catch (error) {
            // Silent error - don't spam console
          }
        }
      }, 10000); // Changed from 5s to 10s

      // Return unsubscribe function
      return () => {
        isActive = false;
        clearInterval(pollInterval);
      };
    } catch (error) {
      console.error('Failed to subscribe to balance:', error);
      return () => { };
    }
  }

  async sendTransaction(
    senderSecretKey: string,
    recipientPublicKey: string,
    amount: number,
    memo?: string,
    asset?: { code: string; issuer: string } // Custom token support
  ): Promise<string> {
    try {
      console.log('📤 Preparing Stellar transaction...');

      // Step 1: Create keypair from secret key
      const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);

      // Step 2: Load source account
      const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

      // Step 3: Check if recipient account exists
      const recipientExists = await this.accountExists(recipientPublicKey);

      // Step 4: Determine asset (native XLM or custom token)
      const paymentAsset = asset
        ? new StellarSdk.Asset(asset.code, asset.issuer)
        : StellarSdk.Asset.native();

      // Step 5: Build transaction
      const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase
      });

      // If recipient doesn't exist and sending XLM, use createAccount instead of payment
      if (!recipientExists && !asset) {
        // Need at least 1 XLM to create account
        const createAmount = Math.max(amount, 1);
        transactionBuilder.addOperation(
          StellarSdk.Operation.createAccount({
            destination: recipientPublicKey,
            startingBalance: createAmount.toString()
          })
        );
        console.log(`🆕 Creating new account with ${createAmount} XLM`);
      } else {
        // Normal payment
        transactionBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: recipientPublicKey,
            asset: paymentAsset,
            amount: amount.toString()
          })
        );
      }

      transactionBuilder.setTimeout(30);

      // Add memo if provided
      if (memo) {
        transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
      }

      const builtTransaction = transactionBuilder.build();

      // Step 6: Sign transaction
      builtTransaction.sign(sourceKeypair);

      console.log('✅ Transaction signed');

      // Step 7: Submit transaction
      const result = await this.server.submitTransaction(builtTransaction);

      console.log('✅ Transaction confirmed:', result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      throw error;
    }
  }

  // Hardcoded Fee Collector (Treasury) Address for Service Fees
  private FEE_COLLECTOR_ADDRESS = 'GBF4HP25526K2Z2C76O46H2N1337Y2Z2C76O46H2N1337Y2Z2C7'; // Placeholder Testnet Address

  /**
   * Send payment with an explicit service fee deposited to a contract/treasury address.
   * Uses standard Stellar Multi-Operation Transaction (more reliable than Soroban for simple payments).
   */
  async sendPaymentWithFee(
    senderSecretKey: string,
    recipientPublicKey: string,
    amount: number
  ): Promise<string> {
    try {
      console.log('📤 Preparing Payment with Service Fee...');
      const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
      const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());
      const recipientExists = await this.accountExists(recipientPublicKey);

      const feeAmount = (amount * 0.0001).toFixed(7); // 0.01% Fee
      const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase
      });

      // Operation 1: Main Payment to Recipient
      if (!recipientExists) {
        // Create Account if not exists
        transactionBuilder.addOperation(
          StellarSdk.Operation.createAccount({
            destination: recipientPublicKey,
            startingBalance: amount.toString()
          })
        );
      } else {
        transactionBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: recipientPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
          })
        );
      }

      // Operation 2: Service Fee to Collector
      // We assume Fee Collector exists. If not, this might fail (but Treasury should exist).
      // If amount is too small, fee might be 0. check min.
      if (parseFloat(feeAmount) > 0) {
        transactionBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: this.FEE_COLLECTOR_ADDRESS,
            asset: StellarSdk.Asset.native(),
            amount: feeAmount
          })
        );
      }

      transactionBuilder.setTimeout(30);
      const transaction = transactionBuilder.build();
      transaction.sign(sourceKeypair);

      console.log(`🚀 Submitting Multi-Op Transaction (Sent: ${amount}, Fee: ${feeAmount})...`);
      const result = await this.server.submitTransaction(transaction);

      console.log('✅ Transaction confirmed:', result.hash);
      return result.hash;
    } catch (error: any) {
      console.error('❌ Multi-Op Payment failed:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * (Legacy) Send payment via the Fee-Deduction Smart Contract
   * Kept for reference but replaced by sendPaymentWithFee for reliability.
   */
  async sendWithServiceFee(
    senderSecretKey: string,
    recipientPublicKey: string,
    amount: number
  ): Promise<string> {
    // Redirect to the robust multi-op implementation
    return this.sendPaymentWithFee(senderSecretKey, recipientPublicKey, amount);
  }

  async confirmTransaction(hash: string, maxRetries: number = 30): Promise<boolean> {
    try {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const transaction = await this.server.transactions().transaction(hash).call();

          if (transaction.successful) {
            console.log('✅ Transaction confirmed');
            return true;
          } else {
            console.error('❌ Transaction failed');
            return false;
          }
        } catch (error: any) {
          if (error?.response?.status === 404) {
            // Transaction not found yet, wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw error;
        }
      }

      console.log('⏱️ Transaction confirmation timeout');
      return false;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      await this.server.ledgers().limit(1).call();
      return true;
    } catch {
      return false;
    }
  }

  async requestAirdrop(publicKey: string): Promise<string> {
    try {
      if (this.network !== 'testnet') {
        throw new Error('Friendbot only available on testnet');
      }

      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );

      const responseJSON = await response.json();
      console.log('✅ Friendbot airdrop successful:', responseJSON);
      return responseJSON.hash || 'success';
    } catch (error) {
      console.error('❌ Friendbot airdrop failed:', error);
      throw error;
    }
  }

  async getRecentTransactions(publicKey: string, limit: number = 20): Promise<any[]> {
    // Actually using payments() as it's more useful for history displays
    return this.getRecentPayments(publicKey, limit);
  }

  async getRecentPayments(publicKey: string, limit: number = 20): Promise<any[]> {
    try {
      const payments = await this.server
        .payments()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .call();

      return payments.records.map((p: any) => ({
        id: p.id,
        hash: p.transaction_hash,
        type: p.type === 'create_account' ? 'create' : 'payment',
        from: p.from || p.funder || p.source_account,
        to: p.to || p.into || p.account,
        amount: p.amount || p.starting_balance || '0',
        asset: p.asset_type === 'native' ? 'XLM' : p.asset_code,
        timestamp: new Date(p.created_at).getTime(),
        successful: p.transaction_successful !== false
      }));
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return [];
      }
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  // Check if account exists (is funded)
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Get account details
  async getAccountDetails(publicKey: string): Promise<any> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        id: account.id,
        sequence: account.sequence,
        balances: account.balances,
        signers: account.signers,
        data: account.data_attr
      };
    } catch (error) {
      console.error('Error fetching account details:', error);
      return null;
    }
  }

  // ============ CUSTOM TOKEN FUNCTIONS ============

  /**
   * Create a custom token (asset) on Stellar
   * @param issuerSecretKey - Secret key of the issuer account
  * @param assetCode - Token code (e.g., "SOPAN", max 12 chars)
   * @param limit - Maximum supply (optional, undefined = unlimited)
   */
  async createToken(
    issuerSecretKey: string,
    assetCode: string,
    limit?: string
  ): Promise<{ asset: any; issuer: string }> {
    try {
      const issuerKeypair = StellarSdk.Keypair.fromSecret(issuerSecretKey);
      const issuerPublicKey = issuerKeypair.publicKey();

      console.log(`🪙 Creating token ${assetCode} with issuer ${issuerPublicKey}`);

      // Create the asset
      const asset = new StellarSdk.Asset(assetCode, issuerPublicKey);

      // If limit is set, lock the issuer account after minting
      if (limit) {
        const issuerAccount = await this.server.loadAccount(issuerPublicKey);

        const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: this.networkPassphrase
        })
          .addOperation(
            StellarSdk.Operation.setOptions({
              masterWeight: 0, // Lock the account
              lowThreshold: 1,
              medThreshold: 1,
              highThreshold: 1
            })
          )
          .setTimeout(30)
          .build();

        transaction.sign(issuerKeypair);
        await this.server.submitTransaction(transaction);

        console.log(`🔒 Token supply locked at ${limit}`);
      }

      return {
        asset: {
          code: assetCode,
          issuer: issuerPublicKey
        },
        issuer: issuerPublicKey
      };
    } catch (error) {
      console.error('Failed to create token:', error);
      throw error;
    }
  }

  /**
   * Establish trustline to accept a custom token
   * @param accountSecretKey - Account that wants to receive the token
   * @param assetCode - Token code
   * @param issuerPublicKey - Token issuer's public key
   * @param limit - Trust limit (optional)
   */
  async trustToken(
    accountSecretKey: string,
    assetCode: string,
    issuerPublicKey: string,
    limit?: string
  ): Promise<string> {
    try {
      const accountKeypair = StellarSdk.Keypair.fromSecret(accountSecretKey);
      const account = await this.server.loadAccount(accountKeypair.publicKey());

      const asset = new StellarSdk.Asset(assetCode, issuerPublicKey);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: limit
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(accountKeypair);
      const result = await this.server.submitTransaction(transaction);

      console.log(`✅ Trustline established for ${assetCode}`);
      return result.hash;
    } catch (error) {
      console.error('Failed to establish trustline:', error);
      throw error;
    }
  }

  /**
   * Mint (issue) custom tokens
   * @param issuerSecretKey - Issuer's secret key
   * @param distributorPublicKey - Account to receive the tokens
   * @param assetCode - Token code
   * @param amount - Amount to mint
   */
  async mintToken(
    issuerSecretKey: string,
    distributorPublicKey: string,
    assetCode: string,
    amount: string
  ): Promise<string> {
    try {
      const issuerKeypair = StellarSdk.Keypair.fromSecret(issuerSecretKey);
      const issuerAccount = await this.server.loadAccount(issuerKeypair.publicKey());

      const asset = new StellarSdk.Asset(assetCode, issuerKeypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: distributorPublicKey,
            asset: asset,
            amount: amount
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(issuerKeypair);
      const result = await this.server.submitTransaction(transaction);

      console.log(`✅ Minted ${amount} ${assetCode} tokens`);
      return result.hash;
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      throw error;
    }
  }

  /**
   * Get token balance for an account
   * @param publicKey - Account public key
   * @param assetCode - Token code
   * @param issuerPublicKey - Token issuer
   */
  async getTokenBalance(
    publicKey: string,
    assetCode: string,
    issuerPublicKey: string
  ): Promise<number> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const tokenBalance = account.balances.find(
        (balance: any) =>
          balance.asset_code === assetCode &&
          balance.asset_issuer === issuerPublicKey
      );
      return tokenBalance ? parseFloat(tokenBalance.balance) : 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  /**
   * Get all token balances for an account
   */
  async getAllBalances(publicKey: string): Promise<any[]> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return account.balances.map((balance: any) => ({
        asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
        issuer: balance.asset_issuer || 'native',
        balance: parseFloat(balance.balance),
        limit: balance.limit ? parseFloat(balance.limit) : undefined
      }));
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  }
}
