import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import { ethers } from 'ethers'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

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

const wallets = new Map()

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', chainId: ARC_CHAIN_ID, contractConfigured: !!ARC_DROP_CONTRACT })
})

app.post('/api/wallet/create', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const mockAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    const walletRecord = { userId, address: mockAddress, walletId: 'mock-' + userId, createdAt: new Date().toISOString() }
    wallets.set(userId, walletRecord)

    res.json({ success: true, wallet: { address: mockAddress, walletId: walletRecord.walletId } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/wallet/:userId', async (req, res) => {
  try {
    const wallet = wallets.get(req.params.userId)
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

    const usdcContract = new ethers.Contract(ARC_USDC_ADDRESS, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], provider)
    const balance = await usdcContract.balanceOf(wallet.address)
    const decimals = await usdcContract.decimals()

    res.json({ success: true, wallet: { address: wallet.address, walletId: wallet.walletId, balance: ethers.formatUnits(balance, decimals), chainId: ARC_CHAIN_ID } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tip/send', async (req, res) => {
  try {
    const { senderId, recipientAddress, amount, message = '' } = req.body
    if (!contract) return res.status(500).json({ error: 'Contract not configured' })

    const wallet = wallets.get(senderId)
    if (!wallet) return res.status(404).json({ error: 'Sender not found' })

    const usdcAmount = ethers.parseUnits(amount.toString(), 6)
    const data = contract.interface.encodeFunctionData('sendTip', [recipientAddress, usdcAmount, message])

    const nonce = await provider.getTransactionCount(wallet.address)
    const feeData = await provider.getFeeData()

    const tx = {
      to: ARC_DROP_CONTRACT,
      data,
      value: '0x0',
      chainId: ARC_CHAIN_ID,
      nonce,
      gasLimit: await provider.estimateGas({ to: ARC_DROP_CONTRACT, data, from: wallet.address }),
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    }

    res.json({ success: true, method: 'direct', transaction: tx, contractAddress: ARC_DROP_CONTRACT })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

app.get('/api/leaderboard', async (req, res) => {
  try {
    if (!contract) return res.status(500).json({ error: 'Contract not configured' })
    res.json({ success: true, leaderboard: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
  console.log(`Chain: Arc Testnet (${ARC_CHAIN_ID})`)
})
