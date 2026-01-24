/**
 * Fund your existing wallet with testnet XLM
 * Run with: node scripts/fundMyWallet.js YOUR_PUBLIC_KEY
 */

const StellarSdk = require('@stellar/stellar-sdk');

async function fundWallet(publicKey) {
  console.log('🚀 Funding Your Wallet with Testnet XLM...\n');

  if (!publicKey) {
    console.error('❌ Please provide your public key!');
    console.log('\nUsage: node scripts/fundMyWallet.js YOUR_PUBLIC_KEY');
    console.log('Example: node scripts/fundMyWallet.js GXXXXX...\n');
    process.exit(1);
  }

  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  console.log('📍 Your Public Key:', publicKey);
  console.log('');

  // Request airdrop from Friendbot
  console.log('Requesting testnet XLM from Friendbot...');
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
    process.exit(1);
  }

  // Wait a moment for the transaction to process
  console.log('Checking balance...');
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
    console.log(`\nPublic Key:  ${publicKey}`);
    console.log(`Balance:     ${balance} XLM (testnet)`);
    console.log('\n🔗 View on Stellar Expert:');
    console.log(`https://stellar.expert/explorer/testnet/account/${publicKey}`);
    console.log('\n🔗 Request more XLM anytime:');
    console.log(`https://friendbot.stellar.org?addr=${publicKey}`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

// Get public key from command line argument
const publicKey = process.argv[2];
fundWallet(publicKey)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
