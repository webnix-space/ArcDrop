// ============================================
// ArcDrop Backend - User Controlled Wallets
// NO entitySecretCiphertext needed!
// Much simpler for your use case
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { ethers } from 'ethers';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// ARC TESTNET CONFIGURATION
// ============================================
const ARC_CONFIG = {
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.network',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  usdcDecimals: 6,
  explorer: 'https://testnet.arcscan.app',
  name: 'Arc Testnet'
};

// Circle API Base URL
const CIRCLE_API = 'https://api.circle.com/v1/w3s';

// In-memory user store
const users = new Map();

console.log('🔥 ArcDrop Backend Starting...');
console.log('📡 Chain:', ARC_CONFIG.name);
console.log('💰 USDC:', ARC_CONFIG.usdcAddress);

// ============================================
// HELPER: Get Circle Headers
// ============================================
function getCircleHeaders() {
  return {
    'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ArcDrop',
    chain: ARC_CONFIG.name,
    chainId: ARC_CONFIG.chainId
  });
});

// ============================================
// 1. CREATE USER (Backend creates user in Circle)
// ============================================
app.post('/api/auth/create-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    console.log(`👤 Creating Circle user: ${email}`);

    // Create user in Circle (no ciphertext needed!)
    const userRes = await axios.post(
      `${CIRCLE_API}/users`,
      {},  // Empty body - Circle generates userId
      { headers: getCircleHeaders() }
    );

    const circleUserId = userRes.data.data.id;
    console.log(`✅ Circle user created: ${circleUserId}`);

    res.json({
      success: true,
      userId: circleUserId,
      email
    });

  } catch (error) {
    console.error('User creation error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Failed to create user'
    });
  }
});

// ============================================
// 2. CREATE WALLET (For existing user)
// ============================================
app.post('/api/wallet/create', async (req, res) => {
  try {
    const { userId, userToken } = req.body;

    if (!userId || !userToken) {
      return res.status(400).json({ 
        error: 'userId and userToken required' 
      });
    }

    console.log(`👛 Creating wallet for user: ${userId}`);

    // Create wallet - NO ciphertext needed for User Controlled Wallets!
    const walletRes = await axios.post(
      `${CIRCLE_API}/users/${userId}/wallets`,
      {
        blockchains: ['ARC-TESTNET'],
        accountType: 'EOA'
      },
      { 
        headers: {
          ...getCircleHeaders(),
          'X-User-Token': userToken  // User token from client
        }
      }
    );

    const wallet = walletRes.data.data;
    console.log(`✅ Wallet created: ${wallet.address}`);

    res.json({
      success: true,
      walletId: wallet.id,
      address: wallet.address,
      blockchain: wallet.blockchain
    });

  } catch (error) {
    console.error('Wallet creation error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Wallet creation failed'
    });
  }
});

// ============================================
// 3. GET WALLET BALANCE
// ============================================
app.get('/api/wallet/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;

    // Get wallet from Circle
    const walletRes = await axios.get(
      `${CIRCLE_API}/wallets/${walletId}`,
      { headers: getCircleHeaders() }
    );

    const wallet = walletRes.data.data;

    // Get USDC balance on-chain
    const provider = new ethers.JsonRpcProvider(ARC_CONFIG.rpcUrl);
    const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
    const usdc = new ethers.Contract(ARC_CONFIG.usdcAddress, usdcAbi, provider);
    const rawBalance = await usdc.balanceOf(wallet.address);
    const balance = ethers.formatUnits(rawBalance, ARC_CONFIG.usdcDecimals);

    res.json({
      walletId,
      address: wallet.address,
      balance,
      symbol: 'USDC'
    });

  } catch (error) {
    console.error('Balance error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ============================================
// 4. SEND TIP (Gasless)
// ============================================
app.post('/api/tip/send', async (req, res) => {
  try {
    const { walletId, toAddress, amount, userToken } = req.body;

    if (!walletId || !toAddress || !amount || !userToken) {
      return res.status(400).json({ 
        error: 'walletId, toAddress, amount, userToken required' 
      });
    }

    const tipAmount = parseFloat(amount);
    const amountInUnits = Math.floor(tipAmount * 1e6).toString();

    console.log(`💸 Sending ${tipAmount} USDC to ${toAddress}`);

    // Send transaction - NO ciphertext needed!
    const txRes = await axios.post(
      `${CIRCLE_API}/wallets/${walletId}/transactions`,
      {
        tokenId: 'USDC',
        destinationAddress: toAddress,
        amounts: [amountInUnits],
        feeLevel: 'MEDIUM'
      },
      {
        headers: {
          ...getCircleHeaders(),
          'X-User-Token': userToken
        }
      }
    );

    const tx = txRes.data.data;

    res.json({
      success: true,
      transactionId: tx.id,
      amount: tipAmount,
      status: tx.state
    });

  } catch (error) {
    console.error('Tip error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Tip failed' });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ArcDrop Backend running on port ${PORT}`);
  console.log(`✅ User Controlled Wallets - No ciphertext needed!`);
});
