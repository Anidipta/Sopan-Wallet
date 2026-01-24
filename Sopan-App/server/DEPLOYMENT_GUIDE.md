# Deployment Guide - Sopan Wallet Backend Server

## ⚠️ Important: Platform Selection

**Vercel Limitations:**
- ❌ Cannot compile Rust code (no toolchain)
- ❌ Limited execution time (10-60 seconds)
- ❌ Serverless environment incompatible with `cargo-contract`

**Recommended Platforms:**
- ✅ **Railway.app** - Easiest, supports full builds
- ✅ **Fly.io** - Great for Docker deployments
- ✅ **DigitalOcean App Platform** - Reliable, affordable
- ✅ **Render.com** - Free tier available

---

## Option 1: Railway.app (Recommended)

### Why Railway?
- ✅ Native Rust support
- ✅ Automatic builds
- ✅ Free tier ($5 credit/month)
- ✅ Simple deployment process

### Steps:

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd server
railway init
```

4. **Create `railway.json`** (already included)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

5. **Create `nixpacks.toml`** for Rust support
```toml
[phases.setup]
nixPkgs = ["nodejs", "cargo", "rustc", "gcc"]

[phases.install]
cmds = ["npm install", "cargo install cargo-contract --force"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

6. **Deploy**
```bash
railway up
```

7. **Get Your URL**
```bash
railway domain
```
Your API will be available at: `https://your-app.railway.app`

8. **Update Mobile App**
Edit `mobile/.env`:
```
DEPLOYMENT_API_URL=https://your-app.railway.app
```

---

## Option 2: Fly.io

### Why Fly.io?
- ✅ Docker-based deployments
- ✅ Global edge network
- ✅ Free tier (3 VMs)

### Steps:

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**
```bash
fly auth login
```

3. **Create `Dockerfile`**
```dockerfile
FROM node:18-alpine AS base

# Install Rust and cargo-contract
RUN apk add --no-cache curl build-base
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install cargo-contract --force

# App setup
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

4. **Launch App**
```bash
cd server
fly launch
```

5. **Deploy**
```bash
fly deploy
```

6. **Get Your URL**
```bash
fly status
```

---

## Option 3: DigitalOcean App Platform

### Why DigitalOcean?
- ✅ Reliable infrastructure
- ✅ Affordable ($5/month)
- ✅ Easy GitHub integration

### Steps:

1. **Push to GitHub**
```bash
git add .
git commit -m "Add server"
git push
```

2. **Create App**
- Go to https://cloud.digitalocean.com/apps
- Click "Create App"
- Connect GitHub repository
- Select `server` folder

3. **Configure Build**
- Build Command: `npm install && cargo install cargo-contract --force`
- Run Command: `npm start`
- Add Environment Variable:
  - `NODE_ENV` = `production`

4. **Add Buildpack**
Create `app.yaml`:
```yaml
name: sopan-wallet-server
services:
- name: api
  github:
    branch: main
    deploy_on_push: true
    repo: your-username/Sopan-Wallet
  source_dir: /Sopan-App/server
  build_command: npm install && cargo install cargo-contract
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
```

5. **Deploy**
- Click "Create Resources"
- Wait for deployment

---

## Option 4: Render.com

### Why Render?
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Easy setup

### Steps:

1. **Push to GitHub**

2. **Create Web Service**
- Go to https://dashboard.render.com
- Click "New" → "Web Service"
- Connect repository

3. **Configure**
- Build Command: `npm install && cargo install cargo-contract --force`
- Start Command: `npm start`
- Add Environment Variables

4. **Deploy**
- Click "Create Web Service"

---

## Post-Deployment Configuration

### 1. Update Mobile App

Edit `mobile/.env`:
```env
DEPLOYMENT_API_URL=https://your-deployed-server.com
```

### 2. Test the Connection

```bash
curl https://your-deployed-server.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

### 3. Update SolustAIScreen

The mobile app will automatically use the new backend when deploying contracts!

---

## Environment Variables

### Required
None - the mobile app sends all necessary data in requests.

### Optional
- `PORT` - Server port (default: 3000, auto-set by platforms)
- `NODE_ENV` - Environment (auto-set to production)

---

## Security Considerations

### Current Implementation (For Testing)
⚠️ The mobile app sends private keys to the server for deployment.

### Production Recommendations

1. **Use Wallet Connect or Similar**
   - Keep private keys on device
   - Sign transactions client-side
   - Server only submits signed transactions

2. **Implement Authentication**
```javascript
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

3. **Add Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Monitoring & Logs

### Railway
```bash
railway logs
```

### Fly.io
```bash
fly logs
```

### DigitalOcean
- View logs in the App Platform dashboard

### Render
- View logs in the service dashboard

---

## Troubleshooting

### Build Fails: cargo-contract not found
**Solution:** Ensure Rust toolchain is installed in your Dockerfile/buildpack

### Deployment Times Out
**Solution:** Increase build timeout in platform settings

### Out of Memory
**Solution:** Upgrade instance size or optimize compilation

### Connection Refused from Mobile
**Solution:** Check CORS configuration and firewall rules

---

## Cost Estimates

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Railway | $5 credit/month | $5/month + usage |
| Fly.io | 3 VMs free | $1.94/VM/month |
| DigitalOcean | None | $5/month |
| Render | 750 hours/month | $7/month |

**Recommendation:** Start with Railway or Fly.io free tier for testing.

---

## Next Steps

1. Choose your platform
2. Deploy the server
3. Get your URL
4. Update `mobile/.env` with `DEPLOYMENT_API_URL`
5. Test deployment from mobile app
6. Monitor logs and performance

🚀 Your backend is ready for production!
