// backend/server.js - ES Module Version

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

// Arc Testnet USDC Contract
const USDC_CONTRACT = '0x3600000000000000000000000000000000000000';
const ARC_RPC = 'https://rpc.testnet.arc.network';
const ARC_CHAIN_ID = 5042002;

console.log('🔥 ArcDrop Backend starting...');
console.log('📡 Chain: Arc Testnet (' + ARC_CHAIN_ID + ')');
console.log('💰 USDC Contract:', USDC_CONTRACT);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', chain: 'Arc Testnet', usdc: USDC_CONTRACT });
});

// Get USDC balance
app.get('/api/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const provider = new ethers.JsonRpcProvider(ARC_RPC);
    
    const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
    const usdc = new ethers.Contract(USDC_CONTRACT, usdcAbi, provider);
    const balance = await usdc.balanceOf(address);
    
    res.json({
      address,
      balance: ethers.formatUnits(balance, 6),
      symbol: 'USDC',
      contract: USDC_CONTRACT
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send tip (using Circle API)
app.post('/api/tip', async (req, res) => {
  try {
    const { fromWalletId, toAddress, amount, userToken, encryptionKey } = req.body;
    
    if (!fromWalletId || !toAddress || !amount) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Call Circle API for gasless transfer
    const response = await axios.post(
      'https://api.circle.com/v1/w3s/transactions',
      {
        walletId: fromWalletId,
        tokenId: 'USDC',
        destinationAddress: toAddress,
        amounts: [Math.floor(parseFloat(amount) * 1e6).toString()],
        feeLevel: 'MEDIUM'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      success: true,
      txId: response.data.data.id,
      to: toAddress,
      amount
    });
    
  } catch (error) {
    console.error('Tip error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.message || error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ArcDrop Backend on port ${PORT}`);
});
