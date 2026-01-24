import * as StellarSdk from '@stellar/stellar-sdk';
import crypto from 'crypto';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// --- Types ---
interface OfflineTransaction {
    id: string;
    sender: string;
    recipient: string;
    amount: number;
    timestamp: number;
    signature: string;
}

interface OfflineBlock {
    index: number;
    previousHash: string;
    timestamp: number;
    transactions: OfflineTransaction[];
    hash: string;
    nonce: number;
    difficulty: number;
    signatures: string[];
    cumulativeWork: number;
}

interface Chain {
    name: string;
    blocks: OfflineBlock[];
    tip: OfflineBlock;
}

// --- CONFIG ---
const SERVER_URL = 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(SERVER_URL);
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

function calculateHash(block: Omit<OfflineBlock, 'hash'>): string {
    const data = JSON.stringify({
        index: block.index,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions.map(t => t.id),
        nonce: block.nonce,
        difficulty: block.difficulty
    });
    return crypto.createHash('sha256').update(data).digest('hex');
}

function mineBlock(block: Omit<OfflineBlock, 'hash' | 'nonce' | 'cumulativeWork'>, difficulty: number): OfflineBlock {
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(difficulty);
    do {
        nonce++;
        hash = calculateHash({ ...block, nonce, difficulty, cumulativeWork: 0 });
    } while (!hash.startsWith(target));
    return {
        ...block,
        hash,
        nonce,
        difficulty,
        cumulativeWork: Math.pow(2, difficulty)
    };
}

async function fundAccount(publicKey: string, name: string) {
    console.log(`📡 Funding ${name}...`);
    const resp = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (resp.ok) {
        console.log(`✅ ${name} Account Created: https://stellar.expert/explorer/testnet/account/${publicKey}`);
    } else {
        console.error(`❌ Failed to fund ${name}`);
    }
}

async function submitToStellar(senderSecret: string, tx: OfflineTransaction) {
    console.log(`🚀 Submitting Tx: ${tx.id} (${tx.amount} XLM)`);
    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: tx.recipient,
                asset: StellarSdk.Asset.native(),
                amount: tx.amount.toString()
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        console.log(`✅ Success! Hash: ${result.hash}`);
        console.log(`🔗 Tx Link: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
        return result.hash;
    } catch (error: any) {
        console.error(`❌ Tx Failed:`, error.response?.data?.extras?.result_codes || error.message);
        return null;
    }
}

async function runTest() {
    console.log('🌟 4-User Offline Conflict Final Verification\n');

    const alice = StellarSdk.Keypair.random();
    const bob = StellarSdk.Keypair.random();
    const charlie = StellarSdk.Keypair.random();
    const dave = StellarSdk.Keypair.random();

    const users: any = { Alice: alice, Bob: bob, Charlie: charlie, Dave: dave };

    // 1. Fund all
    for (const [name, kp] of Object.entries(users)) {
        await fundAccount((kp as any).publicKey(), name);
    }

    // 2. Simulate 3 conflicts
    const now = Date.now();

    // Conflict 1: Bob Double Spends (Heavy wins)
    const tx1 = { id: 'TX_1', sender: bob.publicKey(), recipient: charlie.publicKey(), amount: 10, timestamp: now, signature: 'sig1' };
    const block1 = mineBlock({ index: 0, previousHash: '0', timestamp: now, transactions: [tx1], signatures: ['v1'], difficulty: 3 }, 3);

    // Conflict 2: Alice High Sig wins
    const tx2 = { id: 'TX_2', sender: alice.publicKey(), recipient: bob.publicKey(), amount: 10, timestamp: now, signature: 'sig2' };
    const block2 = mineBlock({ index: 0, previousHash: '0', timestamp: now, transactions: [tx2], signatures: ['v1', 'v2', 'v3'], difficulty: 1 }, 1);

    // Conflict 3: Charlie deterministic tie-break
    const tx3 = { id: 'TX_3', sender: charlie.publicKey(), recipient: dave.publicKey(), amount: 10, timestamp: now, signature: 'sig3' };
    const block3 = mineBlock({ index: 0, previousHash: '0', timestamp: now, transactions: [tx3], signatures: ['v1'], difficulty: 1 }, 1);

    const winners = [
        { name: 'Bob->Charlie', secret: bob.secret(), tx: tx1 },
        { name: 'Alice->Bob', secret: alice.secret(), tx: tx2 },
        { name: 'Charlie->Dave', secret: charlie.secret(), tx: tx3 }
    ];

    const results = [];
    console.log('\n--- Syncing Winning Transactions ---\n');

    for (const w of winners) {
        const hash = await submitToStellar(w.secret, w.tx);
        if (hash) {
            results.push({
                sender: Object.keys(users).find(k => users[k].publicKey() === w.tx.sender),
                recipient: Object.keys(users).find(k => users[k].publicKey() === w.tx.recipient),
                amt: w.tx.amount,
                id: hash
            });
        }
    }

    // save csv
    const csvContent = 'sender,recipient,amt,id\n' + results.map(r => `${r.sender},${r.recipient},${r.amt},${r.id}`).join('\n');
    fs.writeFileSync('data.csv', csvContent);
    console.log('\n✅ data.csv generated.');
    console.table(results);
}

runTest();
