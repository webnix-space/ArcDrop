import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json())

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET
const ARC_RPC_URL = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'
const ARC_CHAIN_ID = parseInt(process.env.ARC_CHAIN_ID || '5042002')
const ARC_USDC_ADDRESS = process.env.ARC_USDC_ADDRESS || '0x3600000000000000000000000000000000000000'
const ARC_DROP_CONTRACT = process.env.ARC_DROP_CONTRACT

const provider = new ethers.JsonRpcProvider(ARC_RPC_URL)

const ARC_DROP_ABI = [
  "function sendTip(address _recipient, uint256 _amount, string _message) returns (bool)",
  "function getReceivedTips(address _recipient) view returns (tuple(address sender, address recipient, uint256 amount, string message, uint256 timestamp)[])",
  "function totalReceived(address) view returns (uint256)",
  "function totalSent(address) view returns (uint256)",
  "function platformFeeBps() view returns (uint256)",
  "function minTipAmount() view returns (uint256)"
]

const contract = ARC_DROP_CONTRACT ? new ethers.Contract(ARC_DROP_CONTRACT, ARC_DROP_ABI, provider) : null

// Circle API helper
async function circleRequest(endpoint, method = 'GET', body = null) {
  const res = await fetch(`https://api.circle.com/v1/w3s${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Circle API error')
  return data
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', chainId: ARC_CHAIN_ID, contractConfigured: !!ARC_DROP_CONTRACT })
})

// Create wallet via Circle API
app.post('/api/wallet/create', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    if (!CIRCLE_API_KEY || !CIRCLE_ENTITY_SECRET) {
      return res.status(500).json({ error: 'Circle credentials not configured' })
    }

    // Create wallet set
    const walletSet = await circleRequest('/developer/walletSets', 'POST', {
      idempotencyKey: crypto.randomUUID(),
      name: `ArcDrop-${userId}`,
      entitySecretCipherText: CIRCLE_ENTITY_SECRET
    })

    const walletSetId = walletSet.data?.walletSet?.id
    if (!walletSetId) throw new Error('Wallet set creation failed')

    // Create wallet on Arc Testnet
    const wallet = await circleRequest('/developer/wallets', 'POST', {
      idempotencyKey: crypto.randomUUID(),
      accountType: 'EOA',
      blockchains: ['ARC-TESTNET'],
      count: 1,
      walletSetId,
      entitySecretCipherText: CIRCLE_ENTITY_SECRET
    })

    const walletData = wallet.data?.wallets?.[0]
    if (!walletData) throw new Error('Wallet creation failed')

    res.json({
      success: true,
      wallet: {
        address: walletData.address,
        walletId: walletData.id,
        blockchain: walletData.blockchain,
        walletSetId
      }
    })
  } catch (err) {
    console.error('Wallet create error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get wallet + balance
app.get('/api/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // List wallets and find by name
    const wallets = await circleRequest('/developer/wallets')
    const wallet = wallets.data?.wallets?.find(w => w.name?.includes(userId))

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

    // Get USDC balance
    const balanceRes = await circleRequest(`/developer/wallets/${wallet.id}/balances`)
    const usdcBalance = balanceRes.data?.tokenBalances?.find(
      b => b.token?.address?.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase()
    )

    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        walletId: wallet.id,
        balance: usdcBalance?.amount || '0',
        chainId: ARC_CHAIN_ID
      }
    })
  } catch (err) {
    console.error('Wallet get error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Prepare tip transaction
app.post('/api/tip/send', async (req, res) => {
  try {
    const { senderWalletId, recipientAddress, amount, message = '' } = req.body
    if (!contract) return res.status(500).json({ error: 'Contract not configured' })

    const usdcAmount = ethers.parseUnits(amount.toString(), 6)

    // Create transaction via Circle API
    const tx = await circleRequest('/developer/transactions/contractExecution', 'POST', {
      idempotencyKey: crypto.randomUUID(),
      walletId: senderWalletId,
      contractAddress: ARC_DROP_CONTRACT,
      abiFunctionSignature: 'sendTip(address,uint256,string)',
      abiParameters: [recipientAddress, usdcAmount.toString(), message],
      feeLevel: 'MEDIUM',
      entitySecretCipherText: CIRCLE_ENTITY_SECRET
    })

    res.json({
      success: true,
      method: 'circle_gas_station',
      transactionId: tx.data?.id,
      state: tx.data?.state
    })
  } catch (err) {
    console.error('Tip send error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get received tips
app.get('/api/tips/received/:address', async (req, res) => {
  try {
    if (!contract) return res.status(500).json({ error: 'Contract not configured' })
    const tips = await contract.getReceivedTips(req.params.address)
    const formatted = tips.map(t => ({
      sender: t.sender,
      amount: ethers.formatUnits(t.amount, 6),
      message: t.message,
      timestamp: Number(t.timestamp) * 1000
    }))
    res.json({ success: true, tips: formatted })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    if (!contract) return res.status(500).json({ error: 'Contract not configured' })
    res.json({ success: true, leaderboard: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Contract info
app.get('/api/contract/info', async (req, res) => {
  try {
    if (!contract) return res.json({ contractAddress: ARC_DROP_CONTRACT || 'Not deployed', usdcAddress: ARC_USDC_ADDRESS, chainId: ARC_CHAIN_ID })
    const [feeBps, minTip] = await Promise.all([contract.platformFeeBps(), contract.minTipAmount()])
    res.json({ success: true, contract: { address: ARC_DROP_CONTRACT, usdcAddress: ARC_USDC_ADDRESS, chainId: ARC_CHAIN_ID, platformFeeBps: Number(feeBps), minTipAmount: ethers.formatUnits(minTip, 6) } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`ArcDrop Backend on port ${PORT}`)
  console.log(`Circle API: ${CIRCLE_API_KEY ? 'Configured' : 'Missing'}`)
  console.log(`Chain: Arc Testnet (${ARC_CHAIN_ID})`)
})
