# Solink Help Center

## 📖 Quick Start

### 1. Connect Wallet
1. Go to [solink.network](https://solink.network)
2. Click "Connect Wallet"
3. Choose your Solana wallet (Phantom, Solflare, etc.)
4. Approve the signature request

### 2. Download Extension
1. Go to Chrome Web Store or our [download page](/download)
2. Install "Solink Browser Extension"
3. Open extension and login with your connected wallet

### 3. Start Earning
- Extension runs in background to share bandwidth
- Points credited every heartbeat (~45 seconds)
- View earnings on your [dashboard](/dashboard)

---

## 📱 How to Earn Points

| Activity | Points |
|---|---|
| Running Extension | 1 point per minute |
| Sharing 10 Mbps | ~500 pts/month |
| Sharing 50 Mbps | ~3,000 pts/month |

**Formula:** `Points/minute = Bandwidth_Mbps × 0.7`

---

## 💻 Node Client Setup

### Requirements
- macOS, Linux, or Windows with WSL
- Node.js 18+
- Solana wallet (can be separate from main wallet)

### Installation
```bash
# Clone the repository
git clone https://github.com/Adrenaline189/solink-web-v2
cd solink-web-v2/apps/node-client

# Install dependencies
npm install

# Build
npm run build
```

### Configuration
Create a `.env` file:
```bash
WALLET_PRIVATE_KEY=<your-wallet-private-key>
SOLINK_API_URL=https://solink.network
```

### Run
```bash
node dist/index.js
```

The client will:
- Measure your bandwidth
- Send heartbeat every 15 minutes
- Earn points automatically

---

## 🎁 Referral Program

### How It Works
1. Copy your referral link from [dashboard](/dashboard)
2. Share with friends
3. When they sign up with your link:
   - **You get 100 points** instantly
   - **You get 3%** of all points they earn forever

### Your Referral Code
Your code = first 8 characters of your wallet address (uppercase)

Example: If your wallet is `58p7bc25e2gF...`, your code is `58P7BC25`

---

## 📊 Dashboard Overview

### Points Today
- **Today**: Your points earned today
- **Yesterday**: Points earned yesterday

### System Status
- **Region**: Server region you're connected to
- **Latency**: Connection delay (ms)
- **Version**: Node/Extension version

---

## ❓ FAQ

**Q: Do I need SOL to use Solink?**
A: No, SOL is only needed for transaction fees when you eventually convert points to SLK.

**Q: How is bandwidth measured?**
A: We measure actual download/upload speed when the extension/node is active.

**Q: Can I run both Extension and Node Client?**
A: Yes! They work independently and both earn points.

**Q: When can I convert points to SLK?**
A: After Token Generation Event (TGE), expected Q4 2026.

---

## 🆘 Support

- Email: support@solink.network
- Discord: [Join our community](https://discord.gg/solink)
- GitHub: [Report issues](https://github.com/Adrenaline189/solink-web-v2/issues)
