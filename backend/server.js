// ============================================
// ArcDrop Backend - User Controlled Wallets
// Only needs CIRCLE_API_KEY
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

const ARC_CONFIG = {
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.network',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  usdcDecimals: 6,
  explorer: 'https://testnet.arcscan.app',
  name: 'Arc Testnet'
};

const CIRCLE_API = 'https://api.circle.com/v1/w3s';

// In-memory store
const users = new Map();

console.log('🔥 ArcDrop Backend Starting...');
console.log('📡 Chain:', ARC_CONFIG.name);
console.log('💰 USDC:', ARC_CONFIG.usdcAddress);

const circleHeaders = {
  'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
  'Content-Type': 'application/json'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', chain: ARC_CONFIG.name, chainId: ARC_CONFIG.chainId });
});

// 1. CREATE USER
app.post('/api/auth/create-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email required' });

    console.log(`👤 Creating user: ${email}`);

    const userRes = await axios.post(`${CIRCLE_API}/users`, {}, { headers: circleHeaders });
    const circleUserId = userRes.data.data.id;

    users.set(email, { userId: circleUserId, email });
    console.log(`✅ User created: ${circleUserId}`);

    res.json({ success: true, userId: circleUserId, email });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || 'Failed' });
  }
});

// 2. CREATE WALLET
app.post('/api/wallet/create', async (req, res) => {
  try {
    const { userId, userToken } = req.body;
    if (!userId || !userToken) return res.status(400).json({ error: 'userId and userToken required' });

    console.log(`👛 Creating wallet for: ${userId}`);

    const walletRes = await axios.post(
      `${CIRCLE_API}/users/${userId}/wallets`,
      { blockchains: ['ARC-TESTNET'], accountType: 'EOA' },
      { headers: { ...circleHeaders, 'X-User-Token': userToken }}
    );

    const wallet = walletRes.data.data;
    console.log(`✅ Wallet: ${wallet.address}`);

    res.json({ success: true, walletId: wallet.id, address: wallet.address });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || 'Failed' });
  }
});

// 3. GET BALANCE
app.get('/api/wallet/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;

    const walletRes = await axios.get(`${CIRCLE_API}/wallets/${walletId}`, { headers: circleHeaders });
    const address = walletRes.data.data.address;

    const provider = new ethers.JsonRpcProvider(ARC_CONFIG.rpcUrl);
    const usdc = new ethers.Contract(ARC_CONFIG.usdcAddress, 
      ['function balanceOf(address) view returns (uint256)'], provider);
    const balance = ethers.formatUnits(await usdc.balanceOf(address), 6);

    res.json({ walletId, address, balance, symbol: 'USDC' });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed' });
  }
});

// 4. SEND TIP
app.post('/api/tip/send', async (req, res) => {
  try {
    const { walletId, toAddress, amount, userToken } = req.body;
    if (!walletId || !toAddress || !amount || !userToken) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const amountInUnits = Math.floor(parseFloat(amount) * 1e6).toString();
    console.log(`💸 ${amount} USDC to ${toAddress}`);

    const txRes = await axios.post(
      `${CIRCLE_API}/wallets/${walletId}/transactions`,
      { tokenId: 'USDC', destinationAddress: toAddress, amounts: [amountInUnits], feeLevel: 'MEDIUM' },
      { headers: { ...circleHeaders, 'X-User-Token': userToken }}
    );

    const tx = txRes.data.data;
    res.json({ success: true, transactionId: tx.id, amount: parseFloat(amount), status: tx.state });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || 'Failed' });
  }
});

// 5. GET TRANSACTIONS
app.get('/api/wallet/:walletId/transactions', async (req, res) => {
  try {
    const { walletId } = req.params;
    const txRes = await axios.get(`${CIRCLE_API}/wallets/${walletId}/transactions`, { headers: circleHeaders });
    res.json({ transactions: txRes.data.data || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ArcDrop on port ${PORT}`);
  console.log(`✅ User Controlled Wallets - Simple!`);
});
