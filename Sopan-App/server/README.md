# Sopan Wallet Backend Server

Backend server for compiling Rust smart contracts to WASM and deploying them to Stellar/Soroban.

## Features

- 🦀 Rust to WASM compilation using `cargo-contract`
- 🚀 Stellar/Soroban smart contract deployment
- 📊 Job tracking with real-time status updates
- 🔄 All-in-one deployment endpoint
- ☁️ Vercel-ready deployment

## Prerequisites

### Local Development
- Node.js >= 18.0.0
- Rust toolchain (https://rustup.rs/)
- `cargo-contract` CLI tool

Install cargo-contract:
```bash
cargo install cargo-contract --force
```

### Production (Vercel)
⚠️ **Important:** Vercel serverless functions cannot compile Rust code due to:
- Limited execution time (10s for Hobby, 60s for Pro)
- No Rust toolchain in the runtime environment
- Limited disk space

**For production deployment, consider:**
1. **Docker-based deployment** (Railway, Fly.io, DigitalOcean)
2. **Pre-compiled WASM uploads** (skip compilation, deploy only)
3. **Hybrid approach** (separate compilation service + Vercel for deployment)

## Installation

```bash
cd server
npm install
```

## Configuration

Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3000
NODE_ENV=development
```

## Running Locally

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Server will start at `http://localhost:3000`

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

### 2. Compile Rust to WASM
```http
POST /api/compile
Content-Type: multipart/form-data

file: <rust-file.rs>
```

**Response:**
```json
{
  "jobId": "uuid",
  "message": "Compilation started"
}
```

### 3. Deploy WASM to Stellar
```http
POST /api/deploy
Content-Type: application/json

{
  "wasmJobId": "uuid-from-compile",
  "network": "testnet|mainnet",
  "privateKey": "S..."
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "message": "Deployment started"
}
```

### 4. All-in-One Deployment
```http
POST /api/deploy-contract
Content-Type: multipart/form-data

file: <rust-file.rs>
network: testnet|mainnet
privateKey: S...
```

**Response:**
```json
{
  "jobId": "uuid",
  "message": "Contract deployment started"
}
```

### 5. Get Job Status
```http
GET /api/job/:jobId
```

**Response (Processing):**
```json
{
  "id": "uuid",
  "status": "processing",
  "stage": "Building WASM",
  "filename": "contract.rs",
  "startTime": 1234567890
}
```

**Response (Success):**
```json
{
  "id": "uuid",
  "status": "deployed",
  "stage": "Deployment complete",
  "contractId": "C...",
  "network": "testnet",
  "wasmHash": "abc123...",
  "deployer": "G...",
  "startTime": 1234567890,
  "endTime": 1234567900
}
```

**Response (Error):**
```json
{
  "id": "uuid",
  "status": "failed",
  "error": "Error message",
  "startTime": 1234567890,
  "endTime": 1234567900
}
```

## Deployment to Vercel (⚠️ Limited Functionality)

### Option 1: Pre-compiled WASM Only

Modify the server to skip compilation and only handle deployment:

1. Remove compilation endpoints
2. Accept `.wasm` files directly
3. Deploy to Vercel:

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: Alternative Platforms

For full Rust compilation support:

#### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Add Rust buildpack
3. Configure environment variables
4. Deploy

## Mobile App Integration

Update your mobile app's deployment service:

```typescript
// mobile/src/services/DeploymentService.ts
const API_URL = 'https://your-server.vercel.app'; // or your deployment URL

export class DeploymentService {
  async deployContract(rustFile: File, network: 'testnet' | 'mainnet', privateKey: string) {
    const formData = new FormData();
    formData.append('file', rustFile);
    formData.append('network', network);
    formData.append('privateKey', privateKey);

    const response = await fetch(`${API_URL}/api/deploy-contract`, {
      method: 'POST',
      body: formData,
    });

    const { jobId } = await response.json();
    return this.pollJobStatus(jobId);
  }

  async pollJobStatus(jobId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${API_URL}/api/job/${jobId}`);
      const job = await response.json();

      if (job.status === 'deployed') {
        return job;
      } else if (job.status === 'failed') {
        throw new Error(job.error);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Deployment timeout');
  }
}
```

## Environment Variables

### Local Development
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### Production
No sensitive environment variables needed as the mobile app sends the private key in each request.

⚠️ **Security Note:** In production, consider:
1. Implementing authentication
2. Rate limiting
3. Request validation
4. Storing private keys securely (not sending them to the server)

## Troubleshooting

### cargo-contract not found
```bash
cargo install cargo-contract --force
rustup target add wasm32-unknown-unknown
```

### Compilation timeout
Increase the buffer or timeout in the exec command:
```javascript
execPromise(buildCommand, { 
  cwd: projectDir,
  maxBuffer: 20 * 1024 * 1024, // 20MB
  timeout: 120000 // 2 minutes
});
```

### Vercel deployment fails
- Vercel cannot compile Rust
- Use Railway, Fly.io, or DigitalOcean instead
- Or modify to accept pre-compiled WASM files only

## License

MIT
