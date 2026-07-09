ArcDrop - Nanopayments Micro-Tipping DApp
Gasless USDC tipping on Arc Testnet. Built with Circle Developer Controlled Wallets & Gas Station. For creators, artists, and anyone who wants to send instant micropayments.
Features
Email Login — No seed phrases. Wallet created automatically on first login.
Gasless Tipping — Circle Gas Station sponsors all transaction fees.
MPC Security — Multi-party computation secures private keys.
Cross-Chain Bridge — Bridge USDC from Ethereum, Avalanche, Base, etc. to Arc.
Instant Balance — Real-time USDC balance display.
Transaction History — Track all your tips.
Tech Stack
Layer
Technology
Frontend
React + Vite + Tailwind CSS + Ethers.js
Backend
Node.js + Express + ES Modules
Wallets
Circle Developer Controlled Wallets
Gas
Circle Gas Station
Chain
Arc Testnet (Chain ID 5042002)
Token
USDC (0x3600...0000)

Quick Start
1. Backend (Render)
Environment Variables:
CIRCLE_API_KEY=TEST_API_KEY:your_key_here
CIRCLE_ENTITY_SECRET=your_entity_secret
PORT=10000
Files: - backend/package.json — Dependencies - backend/server.js — API server (ES Modules)
Deploy:
cd backend
npm install
npm start
2. Frontend (Vercel)
Environment Variables:
VITE_API_URL=https://arcdrop-api.onrender.com
Deploy:
cd frontend
npm install
npm run build
# Upload dist/ to Vercel
API Endpoints
Method
Endpoint
Description
GET
/health
Health check
POST
/api/auth/login
Login/create wallet with email
GET
/api/wallet/:id/balance
Get USDC balance
POST
/api/tip/send
Send gasless USDC tip
GET
/api/wallet/:id/transactions
Get transaction history
POST
/api/bridge/to-arc
Bridge USDC from other chains
GET
/api/faucet
Get faucet info
GET
/api/chains
List supported bridge chains

Arc Testnet Details
Field
Value
Network
Arc Testnet
Chain ID
5042002 (0x4CEF52)
RPC
https://rpc.testnet.arc.network
Explorer
https://testnet.arcscan.app
USDC
0x3600000000000000000000000000000000000000
Faucet
https://faucet.circle.com

Folder Structure
ArcDrop/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       └── main.jsx
└── README.md
License
MIT
