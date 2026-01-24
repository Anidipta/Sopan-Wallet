// No changes needed as there is no seed variable in this file.
/**
 * Get free testnet XLM from Friendbot
 * Run with: node scripts/getTestnetXLM.js
 */

const StellarSdk = require('@stellar/stellar-sdk');

async function getTestnetXLM() {
  console.log('🚀 Getting Free Testnet XLM from Friendbot...\n');

  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  // Create a new wallet
  console.log('Step 1: Creating new Stellar wallet...');
  const keypair = StellarSdk.Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();
  
  console.log('✅ Wallet created!');
  console.log('📍 Public Key:', publicKey);
  console.log('🔑 Secret Key:', secretKey);
  console.log('⚠️  SAVE THESE KEYS!\n');

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
    console.log('🎉 SUCCESS! You now have testnet XLM!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📝 YOUR WALLET DETAILS:\n');
    console.log(`Public Key:  ${publicKey}`);
    console.log(`Secret Key:  ${secretKey}`);
    console.log(`Balance:     ${balance} XLM (testnet)`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Save these keys in a secure location');
    console.log('2. This is TESTNET XLM (not real money)');
    console.log('3. Use this wallet in your app for testing');
    console.log('4. Testnet resets periodically - balances may disappear');
    console.log('\n🔗 View on Stellar Expert:');
    console.log(`https://stellar.expert/explorer/testnet/account/${publicKey}`);
    console.log('\n🔗 Request more XLM anytime:');
    console.log(`https://friendbot.stellar.org?addr=${publicKey}`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

// Run the script
getTestnetXLM()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
