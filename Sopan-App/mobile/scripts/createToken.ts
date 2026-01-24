/**
 * Script to create SOPAN token on Stellar
 * Run with: npx ts-node scripts/createToken.ts
 */

import { StellarService } from '../src/services/StellarService';

async function createSopanToken() {
  console.log('🚀 Creating SOPAN Token on Stellar Testnet...\n');

  const stellar = new StellarService('testnet');

  // Step 1: Create issuer account
  console.log('Step 1: Creating issuer account...');
  const issuer = await stellar.createWallet();
  console.log('✅ Issuer Public Key:', issuer.publicKey);
  console.log('⚠️  Issuer Secret Key:', issuer.secretKey);
  console.log('   SAVE THIS SECRET KEY SECURELY!\n');

  // Step 2: Fund issuer account
  console.log('Step 2: Funding issuer account with testnet XLM...');
  await stellar.requestAirdrop(issuer.publicKey);
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for funding
  const balance = await stellar.getBalance(issuer.publicKey);
  console.log(`✅ Issuer balance: ${balance} XLM\n`);

  // Step 3: Create SOPAN token
  console.log('Step 3: Creating SOPAN token...');
  const token = await stellar.createToken(
    issuer.secretKey,
    'SOPAN',
    '1000000000' // 1 billion token supply
  );
  console.log('✅ Token created!');
  console.log('   Asset Code:', token.asset.code);
  console.log('   Issuer:', token.asset.issuer);
  console.log('\n');

  // Step 4: Create distributor account
  console.log('Step 4: Creating distributor account...');
  const distributor = await stellar.createWallet();
  console.log('✅ Distributor Public Key:', distributor.publicKey);
  console.log('⚠️  Distributor Secret Key:', distributor.secretKey);
  console.log('   SAVE THIS SECRET KEY SECURELY!\n');

  // Step 5: Fund distributor
  console.log('Step 5: Funding distributor account...');
  await stellar.requestAirdrop(distributor.publicKey);
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('✅ Distributor funded\n');

  // Step 6: Establish trustline
  console.log('Step 6: Establishing trustline...');
  await stellar.trustToken(
    distributor.secretKey,
    'SOPAN',
    issuer.publicKey
  );
  console.log('✅ Trustline established\n');

  // Step 7: Mint initial supply
  console.log('Step 7: Minting initial token supply...');
  await stellar.mintToken(
    issuer.secretKey,
    distributor.publicKey,
    'SOPAN',
    '1000000' // 1 million tokens to distributor
  );
  console.log('✅ Minted 1,000,000 SOPAN tokens\n');

  // Step 8: Check balances
  console.log('Step 8: Verifying balances...');
  const distributorBalance = await stellar.getTokenBalance(
    distributor.publicKey,
    'SOPAN',
    issuer.publicKey
  );
  console.log(`✅ Distributor SOPAN balance: ${distributorBalance}\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 SOPAN TOKEN CREATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📝 SAVE THESE DETAILS:\n');
  console.log('Token Configuration:');
  console.log('-------------------');
  console.log(`Asset Code: SOPAN`);
  console.log(`Issuer: ${issuer.publicKey}`);
  console.log(`Supply: 1,000,000,000 (1 billion)`);
  console.log(`Initial Distribution: 1,000,000 tokens`);
  console.log('\nAccounts:');
  console.log('---------');
  console.log(`Issuer Public Key: ${issuer.publicKey}`);
  console.log(`Issuer Secret Key: ${issuer.secretKey}`);
  console.log(`\nDistributor Public Key: ${distributor.publicKey}`);
  console.log(`Distributor Secret Key: ${distributor.secretKey}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Save these keys in a secure location');
  console.log('2. Update src/config/token.ts with the issuer public key');
  console.log('3. Set USE_CUSTOM_TOKEN = true in token.ts');
  console.log('4. Never share your secret keys!');
  console.log('\n🔗 View on Stellar Expert:');
  console.log(`https://stellar.expert/explorer/testnet/asset/SOPAN-${issuer.publicKey}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the script
createSopanToken()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
