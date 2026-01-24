/**
 * Regenerate YOUR wallet from email+phone and fund it
 * Run with: node scripts/fundMyExistingWallet.js YOUR_EMAIL YOUR_PHONE
 */

const StellarSdk = require('@stellar/stellar-sdk');
const nacl = require('tweetnacl');

async function fundMyWallet(email, phone) {
  console.log('🚀 Regenerating YOUR Stellar Wallet and Funding It...\n');

  if (!email || !phone) {
    console.error('❌ Please provide your email and phone!');
    console.log('\nUsage: node scripts/fundMyExistingWallet.js YOUR_EMAIL YOUR_PHONE');
    console.log('Example: node scripts/fundMyExistingWallet.js user@example.com +1234567890\n');
    process.exit(1);
  }

  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  // Recreate wallet using same logic as app
  console.log('Step 1: Regenerating your wallet from credentials...');
  const seed = `sopan:${email}:${phone}`;
  const seedBytes = new TextEncoder().encode(seed);
  const hash = nacl.hash(seedBytes).slice(0, 32);
  const keypair = StellarSdk.Keypair.fromRawEd25519Seed(Buffer.from(hash));
  
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  console.log('✅ Wallet regenerated!');
  console.log('📍 Public Key:', publicKey);
  console.log('🔑 Secret Key:', secretKey);
  console.log('');

  // Request airdrop from Friendbot
  console.log('Step 2: Requesting testnet XLM from Friendbot...');
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    const responseJSON = await response.json();
    console.log('✅ Airdrop successful!');
    console.log('Transaction Hash:', responseJSON.hash, '\n');
  } catch (error) {
    console.error('❌ Airdrop failed:', error.message);
    console.log('\n💡 You can also request manually at:');
    console.log(`https://friendbot.stellar.org?addr=${publicKey}\n`);
  }

  // Wait a moment for the transaction to process
  console.log('Step 3: Checking balance...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(
      balance => balance.asset_type === 'native'
    );
    const balance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    
    console.log(`✅ Balance: ${balance} XLM\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Your wallet is funded!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\nEmail:       ${email}`);
    console.log(`Phone:       ${phone}`);
    console.log(`Public Key:  ${publicKey}`);
    console.log(`Secret Key:  ${secretKey}`);
    console.log(`Balance:     ${balance} XLM (testnet)`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('This is the SAME wallet your app will use!');
    console.log('When you login with these credentials, you\'ll see this balance.');
    console.log('\n🔗 View on Stellar Expert:');
    console.log(`https://stellar.expert/explorer/testnet/account/${publicKey}`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

// Get email and phone from command line arguments
const email = process.argv[2];
const phone = process.argv[3];

fundMyWallet(email, phone)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
