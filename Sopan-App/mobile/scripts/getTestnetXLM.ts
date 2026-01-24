// No changes needed as there is no seed variable in this file.
/**
 * Get free testnet XLM from Friendbot
 * Run with: npx ts-node scripts/getTestnetXLM.ts
 */

import { StellarService } from '../src/services/StellarService';

async function getTestnetXLM() {
  console.log('🚀 Getting Free Testnet XLM from Friendbot...\n');

  const stellar = new StellarService('testnet');

  // Create a new wallet
  console.log('Step 1: Creating new Stellar wallet...');
  const wallet = await stellar.createWallet();
  console.log('✅ Wallet created!');
  console.log('📍 Public Key:', wallet.publicKey);
  console.log('🔑 Secret Key:', wallet.secretKey);
  console.log('⚠️  SAVE THESE KEYS!\n');

  // Request airdrop from Friendbot
  console.log('Step 2: Requesting testnet XLM from Friendbot...');
  try {
    await stellar.requestAirdrop(wallet.publicKey);
    console.log('✅ Airdrop successful!\n');
  } catch (error) {
    console.error('❌ Airdrop failed:', error);
    console.log('\n💡 You can also request manually at:');
    console.log(`https://friendbot.stellar.org?addr=${wallet.publicKey}\n`);
  }

  // Wait a moment for the transaction to process
  console.log('Step 3: Checking balance...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const balance = await stellar.getBalance(wallet.publicKey);
  console.log(`✅ Balance: ${balance} XLM\n`);

  // Get account details
  const details = await stellar.getAccountDetails(wallet.publicKey);
  console.log('Account Details:');
  console.log('---------------');
  console.log('Sequence:', details?.sequence);
  console.log('Balances:', details?.balances);
  console.log('\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 SUCCESS! You now have testnet XLM!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📝 YOUR WALLET DETAILS:\n');
  console.log(`Public Key:  ${wallet.publicKey}`);
  console.log(`Secret Key:  ${wallet.secretKey}`);
  console.log(`Balance:     ${balance} XLM (testnet)`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Save these keys in a secure location');
  console.log('2. This is TESTNET XLM (not real money)');
  console.log('3. Use this wallet in your app for testing');
  console.log('\n🔗 View on Stellar Expert:');
  console.log(`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`);
  console.log('\n🔗 View on Stellar Laboratory:');
  console.log(`https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&network=test&values=eyJhY2NvdW50X2lkIjoiJHt3YWxsZXQucHVibGljS2V5fSJ9`);
  console.log('═══════════════════════════════════════════════════════\n');
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
