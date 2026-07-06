// ============================================
// ArcDrop Backend - Fixed for Arc Testnet
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initiateUserControlledWalletsClient } = require('@circle-fin/w3s-pw-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Arc Testnet Configuration
const ARC_CONFIG = {
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.network',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  usdcDecimals: 6,
  explorer: 'https://testnet.arcscan.app'
};

// Initialize Circle SDK
const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

console.log('🔥 ArcDrop Backend starting...');
console.log('📡 Chain: Arc Testnet (5042002)');
console.log('💰 USDC Contract:', ARC_CONFIG.usdcAddress);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    chain: 'Arc Testnet',
    usdcConfigured: !!ARC_CONFIG.usdcAddress
  });
});

// ============================================
// GET WALLET BALANCE
// ============================================
app.get('/api/wallet/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Call Circle API to get wallet balance
    const response = await circleClient.getWallet({
      id: walletId
    });
    
    // Find USDC balance
    const usdcBalance = response.data?.wallet?.balances?.find(
      b => b.token?.address?.toLowerCase() === ARC_CONFIG.usdcAddress.toLowerCase()
    );
    
    res.json({
      walletId,
      balance: usdcBalance?.amount || '0',
      decimals: ARC_CONFIG.usdcDecimals,
      symbol: 'USDC',
      contractAddress: ARC_CONFIG.usdcAddress
    });
    
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SEND TIP (Gasless via Gas Station)
// ============================================
app.post('/api/tip', async (req, res) => {
  try {
    const { fromWalletId, toAddress, amount, message, userToken, encryptionKey } = req.body;
    
    // Validate inputs
    if (!fromWalletId || !toAddress || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: fromWalletId, toAddress, amount' 
      });
    }
    
    // Convert amount to USDC decimals (6)
    const amountInUnits = Math.floor(parseFloat(amount) * Math.pow(10, ARC_CONFIG.usdcDecimals)).toString();
    
    console.log(`💸 Sending ${amount} USDC from ${fromWalletId} to ${toAddress}`);
    
    // Create the transaction via Circle API
    // This uses Gas Station automatically if configured
    const response = await circleClient.createTransaction({
      walletId: fromWalletId,
      tokenId: 'USDC',  // Circle's token identifier
      destinationAddress: toAddress,
      amounts: [amountInUnits],
      feeLevel: 'MEDIUM',  // Gas Station handles this
      // Note: userToken and encryptionKey needed for user-controlled wallets
    });
    
    res.json({
      success: true,
      transactionId: response.data?.id,
      from: fromWalletId,
      to: toAddress,
      amount: amount,
      message: message || '',
      explorerUrl: `${ARC_CONFIG.explorer}/tx/${response.data?.txHash || ''}`
    });
    
  } catch (error) {
    console.error('Tip error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// ============================================
// CREATE WALLET (with logging)
// ============================================
app.post('/api/wallet/create', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log(`👤 Creating wallet for user: ${userId}`);
    
    const response = await circleClient.createWallet({
      userId: userId,
      blockchains: ['ARC-TESTNET'],  // Use ARC-TESTNET for Arc
      accountType: 'EOA',  // or 'SCA' for Smart Contract Account
      walletSetId: process.env.CIRCLE_WALLET_SET_ID
    });
    
    const wallet = response.data?.wallets?.[0];
    
    console.log(`✅ Wallet created: ${wallet?.address} for user ${userId}`);
    console.log(`   Wallet ID: ${wallet?.id}`);
    console.log(`   Blockchain: ${wallet?.blockchain}`);
    
    res.json({
      success: true,
      walletId: wallet?.id,
      address: wallet?.address,
      blockchain: wallet?.blockchain,
      createdAt: wallet?.createDate
    });
    
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET TRANSACTION HISTORY
// ============================================
app.get('/api/wallet/:walletId/transactions', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const response = await circleClient.getTransactions({
      walletIds: [walletId]
    });
    
    res.json({
      walletId,
      transactions: response.data?.transactions || []
    });
    
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 ArcDrop Backend running on port ${PORT}`);
  console.log(`🔗 USDC Contract: ${ARC_CONFIG.usdcAddress}`);
  console.log(`⛽ Gas Station: ${process.env.CIRCLE_GAS_STATION_ENABLED ? 'ENABLED' : 'NOT CONFIGURED'}`);
});
