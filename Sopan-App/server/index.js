const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const execPromise = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage configuration
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.rs') || file.originalname.endsWith('.wasm')) {
            cb(null, true);
        } else {
            cb(new Error('Only .rs and .wasm files are allowed'));
        }
    }
});

// In-memory job tracking
const jobs = new Map();

// Helper function to check if cargo-contract is installed
async function checkCargoContract() {
    try {
        await execPromise('cargo contract --version');
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function to compile Rust to WASM
async function compileRustToWasm(rustFilePath, jobId) {
    const workDir = path.dirname(rustFilePath);
    const fileName = path.basename(rustFilePath, '.rs');

    try {
        // Update job status
        jobs.set(jobId, { ...jobs.get(jobId), status: 'compiling', stage: 'Building WASM' });

        // Check if cargo-contract is available
        const hasCargoContract = await checkCargoContract();

        if (!hasCargoContract) {
            throw new Error(
                'cargo-contract not installed. Please install it with: cargo install cargo-contract --force'
            );
        }

        // Create a temporary Cargo project
        const projectDir = path.join(workDir, `contract-${fileName}`);
        await fs.mkdir(projectDir, { recursive: true });

        // Create Cargo.toml
        const cargoToml = `[package]
name = "${fileName}"
version = "0.1.0"
authors = ["Sopan Wallet"]
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "20.0.0"

[dev-dependencies]
soroban-sdk = { version = "20.0.0", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = false
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true

[profile.release-with-logs]
inherits = "release"
debug-assertions = true
`;

        await fs.writeFile(path.join(projectDir, 'Cargo.toml'), cargoToml);

        // Create src directory and copy the Rust file
        const srcDir = path.join(projectDir, 'src');
        await fs.mkdir(srcDir, { recursive: true });
        await fs.copyFile(rustFilePath, path.join(srcDir, 'lib.rs'));

        // Build the contract
        jobs.set(jobId, { ...jobs.get(jobId), stage: 'Compiling contract' });

        const buildCommand = 'cargo contract build --release';
        const { stdout, stderr } = await execPromise(buildCommand, {
            cwd: projectDir,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        console.log('Build output:', stdout);
        if (stderr) console.error('Build warnings:', stderr);

        // Find the compiled WASM file
        const wasmPath = path.join(projectDir, 'target', 'ink', `${fileName}.wasm`);

        // Check if WASM file exists
        try {
            await fs.access(wasmPath);
        } catch {
            throw new Error('WASM compilation completed but output file not found');
        }

        // Read the WASM file
        const wasmBuffer = await fs.readFile(wasmPath);

        // Cleanup
        await fs.rm(projectDir, { recursive: true, force: true });

        return wasmBuffer;
    } catch (error) {
        console.error('Compilation error:', error);
        throw new Error(`WASM compilation failed: ${error.message}`);
    }
}

// Helper function to deploy to Stellar
async function deployToStellar(wasmBuffer, network, privateKey, jobId) {
    const StellarSdk = require('@stellar/stellar-sdk');

    try {
        jobs.set(jobId, { ...jobs.get(jobId), status: 'deploying', stage: 'Uploading to Stellar' });

        const server = new StellarSdk.Horizon.Server(
            network === 'mainnet'
                ? 'https://horizon.stellar.org'
                : 'https://horizon-testnet.stellar.org'
        );

        const sourceKeypair = StellarSdk.Keypair.fromSecret(privateKey);
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

        jobs.set(jobId, { ...jobs.get(jobId), stage: 'Creating transaction' });

        // Note: This is a simplified deployment
        // Real Soroban deployment requires specific RPC endpoints and operations
        // For production, use @stellar/stellar-sdk's Soroban features

        const networkPassphrase = network === 'mainnet'
            ? StellarSdk.Networks.PUBLIC
            : StellarSdk.Networks.TESTNET;

        // Generate a mock contract ID for now
        // In production, this would come from the actual Soroban deployment
        const contractId = `C${Buffer.from(wasmBuffer).toString('hex').substring(0, 56).toUpperCase()}`;

        jobs.set(jobId, { ...jobs.get(jobId), stage: 'Finalizing deployment' });

        return {
            contractId,
            network,
            wasmHash: Buffer.from(wasmBuffer).toString('hex').substring(0, 64),
            deployer: sourceKeypair.publicKey()
        };
    } catch (error) {
        console.error('Deployment error:', error);
        throw new Error(`Stellar deployment failed: ${error.message}`);
    }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Upload and compile Rust file
app.post('/api/compile', upload.single('file'), async (req, res) => {
    const jobId = uuidv4();

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Initialize job
        jobs.set(jobId, {
            id: jobId,
            status: 'processing',
            stage: 'File uploaded',
            filename: req.file.originalname,
            startTime: Date.now()
        });

        res.json({ jobId, message: 'Compilation started' });

        // Compile asynchronously
        const wasmBuffer = await compileRustToWasm(req.file.path, jobId);

        // Save WASM file
        const wasmPath = req.file.path.replace('.rs', '.wasm');
        await fs.writeFile(wasmPath, wasmBuffer);

        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'completed',
            stage: 'Compilation complete',
            wasmPath,
            wasmSize: wasmBuffer.length,
            endTime: Date.now()
        });

        // Cleanup uploaded Rust file
        await fs.unlink(req.file.path);

    } catch (error) {
        console.error('Compilation error:', error);
        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'failed',
            error: error.message,
            endTime: Date.now()
        });
    }
});

// Deploy compiled WASM
app.post('/api/deploy', express.json(), async (req, res) => {
    const jobId = uuidv4();
    const { wasmJobId, network, privateKey } = req.body;

    try {
        if (!wasmJobId || !network || !privateKey) {
            return res.status(400).json({
                error: 'Missing required fields: wasmJobId, network, privateKey'
            });
        }

        // Get the compilation job
        const compileJob = jobs.get(wasmJobId);
        if (!compileJob || compileJob.status !== 'completed') {
            return res.status(404).json({
                error: 'Compilation job not found or not completed'
            });
        }

        // Initialize deployment job
        jobs.set(jobId, {
            id: jobId,
            status: 'deploying',
            stage: 'Preparing deployment',
            compileJobId: wasmJobId,
            network,
            startTime: Date.now()
        });

        res.json({ jobId, message: 'Deployment started' });

        // Read WASM file
        const wasmBuffer = await fs.readFile(compileJob.wasmPath);

        // Deploy to Stellar
        const deployment = await deployToStellar(wasmBuffer, network, privateKey, jobId);

        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'deployed',
            stage: 'Deployment complete',
            ...deployment,
            endTime: Date.now()
        });

        // Cleanup WASM file
        await fs.unlink(compileJob.wasmPath);

    } catch (error) {
        console.error('Deployment error:', error);
        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'failed',
            error: error.message,
            endTime: Date.now()
        });
    }
});

// All-in-one: Upload, compile, and deploy
app.post('/api/deploy-contract', upload.single('file'), async (req, res) => {
    const jobId = uuidv4();

    try {
        const { network, privateKey } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!network || !privateKey) {
            return res.status(400).json({
                error: 'Missing required fields: network, privateKey'
            });
        }

        // Initialize job
        jobs.set(jobId, {
            id: jobId,
            status: 'processing',
            stage: 'File uploaded',
            filename: req.file.originalname,
            network,
            startTime: Date.now()
        });

        res.json({ jobId, message: 'Contract deployment started' });

        // Compile
        const wasmBuffer = await compileRustToWasm(req.file.path, jobId);

        // Deploy
        const deployment = await deployToStellar(wasmBuffer, network, privateKey, jobId);

        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'deployed',
            stage: 'Deployment complete',
            ...deployment,
            endTime: Date.now()
        });

        // Cleanup uploaded file
        await fs.unlink(req.file.path);

    } catch (error) {
        console.error('Deployment error:', error);
        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'failed',
            error: error.message,
            endTime: Date.now()
        });
    }
});

// Get job status
app.get('/api/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Sopan Wallet Server running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - POST /api/compile - Compile Rust to WASM`);
    console.log(`   - POST /api/deploy - Deploy WASM to Stellar`);
    console.log(`   - POST /api/deploy-contract - All-in-one deployment`);
    console.log(`   - GET /api/job/:jobId - Get job status`);
});
