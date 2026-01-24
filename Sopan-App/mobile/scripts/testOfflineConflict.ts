import * as StellarSdk from '@stellar/stellar-sdk';
import crypto from 'crypto';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as readline from 'readline/promises';

// --- Types ---
interface OfflineTransaction {
    tId: string; // T1, T2, etc.
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

// --- CONFIG ---
const SERVER_URL = 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(SERVER_URL);
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Fixed credentials from user
const KEYS = {
    A: { name: 'Alice', secret: 'SCTNIXCQV73JXU6BDIDZ4AOR7Z3CX6I7PEGU32MAK6Y3H26X46BUO6S7' },
    B: { name: 'Bob', secret: 'SBB5BMQGXX6FAYU5QCW772XNJOTWQQRXILAKWVDTA7RXCET33GZKGNTY' },
    C: { name: 'Charlie', secret: 'SADBQRQNBQBKGF2HBQIWHLNHDFMFNNMHUELFCYONJUXENYMXWKLACQZK' },
    D: { name: 'Dave', secret: 'SAVRV5P7RDJZLZAXGCGCEDZ2X6AOO6OQVLOMPXDJESR7AEFVR76JP27N' }
};

const users = Object.fromEntries(
    Object.entries(KEYS).map(([key, info]) => [key, StellarSdk.Keypair.fromSecret(info.secret)])
);

function calculateHash(block: Omit<OfflineBlock, 'hash'>): string {
    const data = JSON.stringify({
        index: block.index,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions.map(t => t.tId),
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
    console.log(`📡 Checking/Funding ${name} (${publicKey})...`);
    try {
        await server.loadAccount(publicKey);
        console.log(`✅ ${name} Account already exists.`);
    } catch (e) {
        const resp = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        if (resp.ok) {
            console.log(`✅ ${name} Account Created.`);
        } else {
            console.error(`❌ Failed to fund ${name}`);
        }
    }
}

async function submitToStellar(senderSecret: string, tx: OfflineTransaction) {
    console.log(`🚀 Submitting ${tx.tId}: ${KEYS[tx.sender as keyof typeof KEYS].name} -> ${KEYS[tx.recipient as keyof typeof KEYS].name} (${tx.amount} XLM)`);
    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

        const recipientPublic = users[tx.recipient].publicKey();

        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: recipientPublic,
                asset: StellarSdk.Asset.native(),
                amount: tx.amount.toString()
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        return result.hash;
    } catch (error: any) {
        console.error(`❌ ${tx.tId} Failed:`, error.response?.data?.extras?.result_codes || error.message);
        return null;
    }
}

async function runTest() {
    console.log('🌟 Interactive Offline Conflict Simulator');

    // 1. Ensure all are funded (Parallelized)
    console.log('📡 Checking/Funding accounts in parallel...');
    await Promise.all(Object.entries(users).map(([key, kp]) =>
        fundAccount(kp.publicKey(), KEYS[key as keyof typeof KEYS].name)
    ));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const proposals: { tId: string, block: OfflineBlock }[] = [];
    let tCounter = 1;

    console.log('\n--- Input Transactions ---');
    console.log('Format: AB10 (A send to B 10 XLM). Enter 0 to finish.');

    while (true) {
        const input = (await rl.question(`T${tCounter} > `)).trim().toUpperCase();
        if (input === '0') break;

        const match = input.match(/^([A-D])([A-D])(\d+(\.\d+)?)$/);
        if (!match) {
            console.log('Invalid format. Try again (e.g. AC577).');
            continue;
        }

        const [, sender, recipient, amountStr] = match;
        const amount = parseFloat(amountStr);
        const tId = `T${tCounter}`;

        // Create an offline transaction
        const tx: OfflineTransaction = {
            tId,
            sender,
            recipient,
            amount,
            timestamp: Date.now(),
            signature: `sig_${tId}`
        };

        // Randomize some block properties to simulate different offline scenarios
        // Normally these would come from the offline peer's state
        const difficulty = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const sigCount = Math.floor(Math.random() * 3) + 1; // 1-3 signatures
        const signatures = Array.from({ length: sigCount }, (_, i) => `v${i + 1}`);

        // Each input is currently treated as a block proposal (Simplified for DAG visualization)
        const block = mineBlock({
            index: 0,
            previousHash: '0',
            timestamp: tx.timestamp,
            transactions: [tx],
            signatures,
            difficulty
        }, difficulty);

        proposals.push({ tId, block });
        console.log(`Added ${tId}: ${KEYS[sender as keyof typeof KEYS].name} -> ${KEYS[recipient as keyof typeof KEYS].name} ${amount} XLM (Work: ${block.cumulativeWork}, Sigs: ${sigCount})`);
        tCounter++;
    }

    if (proposals.length === 0) {
        console.log('No transactions entered. Exiting.');
        rl.close();
        return;
    }

    const bySender: Record<string, typeof proposals> = {};
    proposals.forEach(p => {
        const sender = p.block.transactions[0].sender;
        if (!bySender[sender]) bySender[sender] = [];
        bySender[sender].push(p);
    });

    console.log('\n--- Transaction Sequences per User ---');
    for (const sender in bySender) {
        const sorted = [...bySender[sender]].sort((a, b) => a.block.timestamp - b.block.timestamp);
        const sequenceStr = sorted.map(t => t.tId).join(' -> ');
        console.log(`${KEYS[sender as keyof typeof KEYS].name} : ${sequenceStr}`);
    }

    const winners: { tId: string, block: OfflineBlock, reason: string }[] = [];

    console.log('\n--- Offline DAG Resolution (Ordering) ---');
    for (const sender in bySender) {
        let remaining = [...bySender[sender]];
        const userSequence: { tId: string, block: OfflineBlock, reason: string }[] = [];
        let rank = 1;

        while (remaining.length > 0) {
            // Iterative selection: 1. Cumulative Work, 2. Signature Count, 3. Timestamp (Ascending)
            remaining.sort((a, b) => {
                if (b.block.cumulativeWork !== a.block.cumulativeWork)
                    return b.block.cumulativeWork - a.block.cumulativeWork;
                if (b.block.signatures.length !== a.block.signatures.length)
                    return b.block.signatures.length - a.block.signatures.length;
                return a.block.timestamp - b.block.timestamp;
            });

            const best = remaining.shift()!;
            let reason = '';

            if (rank === 1) {
                if (remaining.length > 0) {
                    const next = remaining[0];
                    if (best.block.cumulativeWork > next.block.cumulativeWork) reason = 'Heavy Work (1st)';
                    else if (best.block.signatures.length > next.block.signatures.length) reason = 'High Sig Count (1st)';
                    else reason = 'Earliest Timestamp (1st)';
                } else {
                    reason = 'Sole Transaction';
                }
            } else {
                reason = `Next in Sequence (Timestamp Rank ${rank})`;
            }

            userSequence.push({ ...best, reason });
            rank++;
        }
        winners.push(...userSequence);
    }

    winners.forEach((w, i) => {
        console.log(`${i + 1} - ${w.reason} [${w.tId}]`);
    });
    console.log(`\nFinal Sequence: ${winners.map(w => w.tId).join(' -> ')}`);

    console.log('\nReady to sync online? (yes/no)');
    const answer = (await rl.question('> ')).trim().toLowerCase();

    if (answer === 'yes') {
        const results: any[] = [];
        console.log('\n--- Synchronizing to Stellar Net (Parallel per Sender) ---\n');

        const winnersBySender: Record<string, typeof winners> = {};
        winners.forEach(w => {
            const sender = w.block.transactions[0].sender;
            if (!winnersBySender[sender]) winnersBySender[sender] = [];
            winnersBySender[sender].push(w);
        });

        await Promise.all(Object.entries(winnersBySender).map(async ([sender, senderWinners]) => {
            const senderName = KEYS[sender as keyof typeof KEYS].name;
            const senderSecret = KEYS[sender as keyof typeof KEYS].secret;
            for (const w of senderWinners) {
                const tx = w.block.transactions[0];
                const hash = await submitToStellar(senderSecret, tx);
                if (hash) {
                    results.push({
                        T_Number: tx.tId,
                        Sender: senderName,
                        Recipient: KEYS[tx.recipient as keyof typeof KEYS].name,
                        Amount: tx.amount,
                        Reason: w.reason,
                        Tx_Hash: hash,
                        Explorer_Link: `https://stellar.expert/explorer/testnet/tx/${hash}`
                    });
                }
            }
        }));

        results.sort((a, b) => parseInt(a.T_Number.slice(1)) - parseInt(b.T_Number.slice(1)));

        const csvHeader = 'T_Number,Sender,Recipient,Amount,Win_Reason,Tx_Hash,Explorer_Link\n';
        const csvRows = results.map(r => `${r.T_Number},${r.Sender},${r.Recipient},${r.Amount},"${r.Reason}",${r.Tx_Hash},${r.Explorer_Link}`).join('\n');
        fs.writeFileSync('data.csv', csvHeader + csvRows);

        console.log('\n✅ Sync Complete');
        // console.table(results);
    } else {
        console.log('Sync aborted.');
    }

    rl.close();
}

runTest();
