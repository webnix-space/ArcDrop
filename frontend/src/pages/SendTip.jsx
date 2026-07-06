import React, { useState, useEffect } from 'react'
import axios from 'axios'

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

  // Load wallet from localStorage on mount
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
      if (res.data.success) {
        setBalance(res.data.wallet.balance)
      }
    } catch (err) {
      console.error('Balance error:', err)
    }
  }

  const createWallet = async () => {
    if (!userId.trim()) {
      alert('Enter a user ID first')
      return
    }
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
      alert('Wallet creation failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!wallet) {
      alert('Create wallet first')
      return
    }
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

  const disconnect = () => {
    localStorage.removeItem('arcdrop_wallet')
    setWallet(null)
    setBalance('0')
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-4">
      <h2 className="text-2xl font-bold">Send Tip</h2>

      {!wallet ? (
        <div className="space-y-3">
          <p className="text-gray-400">Create a Circle wallet to start tipping</p>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
          />
          <button onClick={createWallet} disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg">
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Wallet</p>
              <p className="font-mono text-sm">{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-green-400 font-bold">{parseFloat(balance).toFixed(2)} USDC</p>
            </div>
          </div>
          <button onClick={disconnect} className="text-sm text-red-400">Disconnect</button>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm"
            placeholder="0x..." required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount (USDC)</label>
          <input type="number" step="0.01" min="0.1" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none"
            rows="2" maxLength="200" />
        </div>
        <button type="submit" disabled={loading || !wallet}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg">
          {loading ? 'Sending...' : `Send ${amount} USDC`}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-lg ${result.error ? 'bg-red-900/30 border border-red-500/30' : 'bg-green-900/30 border border-green-500/30'}`}>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
