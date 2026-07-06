import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Loader, CheckCircle, Zap, MessageSquare, Wallet, Copy, ExternalLink } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SendTip() {
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('0')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('1.00')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('arcdrop_wallet')
    if (saved) {
      try {
        const w = JSON.parse(saved)
        setWallet(w)
        fetchBalance(w.walletId)
      } catch (e) {}
    }
  }, [])

  const fetchBalance = async (walletId) => {
    try {
      const res = await axios.get(`${API_BASE}/wallet/${walletId}`)
      if (res.data.success) setBalance(res.data.wallet.balance)
    } catch (err) {}
  }

  const createWallet = async () => {
    if (!userId.trim()) return alert('Enter a user ID')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/wallet/create`, { userId: userId.trim() })
      if (res.data.success) {
        const w = res.data.wallet
        localStorage.setItem('arcdrop_wallet', JSON.stringify(w))
        setWallet(w)
        setBalance('0')
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!wallet) return alert('Create wallet first')
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API_BASE}/tip/send`, {
        senderWalletId: wallet.walletId,
        recipientAddress: recipient,
        amount: parseFloat(amount),
        message
      })
      setResult(res.data)
      fetchBalance(wallet.walletId)
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message })
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const quickAmounts = ['0.50', '1.00', '2.00', '5.00', '10.00']

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Send Tip</h1>

      {/* Wallet Card */}
      {!wallet ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Create Your Wallet</h2>
            <p className="text-gray-400 text-sm mb-4">Set up a Circle Programmable Wallet to start tipping</p>
          </div>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
          />
          <button onClick={createWallet} disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Your Wallet</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</span>
                <button onClick={copyAddress} className="text-gray-500 hover:text-white">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Balance</p>
              <p className="text-2xl font-bold text-green-400">{parseFloat(balance).toFixed(2)} USDC</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>Gasless transactions enabled</span>
          </div>
        </div>
      )}

      {/* Send Form */}
      <form onSubmit={handleSend} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Send Tip</h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">Gasless</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
            placeholder="0x..." required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-green-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
          <input type="number" step="0.01" min="0.1" value={amount} onChange={e => setAmount(e.target.value)}
            required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" />
          <div className="flex gap-2 mt-3">
            {quickAmounts.map(a => (
              <button key={a} type="button" onClick={() => setAmount(a)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${amount === a ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Thanks for the great content!" rows={2} maxLength={200}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-green-500" />
          <p className="text-xs text-gray-600 mt-1 text-right">{message.length}/200</p>
        </div>

        <button type="submit" disabled={loading || !wallet}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {loading ? 'Sending...' : `Send ${amount} USDC`}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`p-5 rounded-2xl border ${result.error ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.error ? <Zap className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
            <span className="font-bold">{result.error ? 'Error' : 'Success'}</span>
          </div>
          <pre className="text-xs overflow-auto text-gray-300">{JSON.stringify(result, null, 2)}</pre>
          {!result.error && result.transactionId && (
            <a href={`https://explorer.testnet.arc.network/tx/${result.transactionId}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-400 text-sm mt-3 hover:underline">
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </a>
          )}
        </div>
      )}
    </div>
  )
}
