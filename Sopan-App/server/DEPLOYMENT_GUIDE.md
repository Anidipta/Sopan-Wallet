# Deployment Guide - Sopan Wallet Backend Server

## Steps:

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