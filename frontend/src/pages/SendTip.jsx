import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SendTip() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('1.00')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/tip/send`, {
        senderId: 'demo-user',
        recipientAddress: recipient,
        amount: parseFloat(amount),
        message
      })
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Send Tip</h2>
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
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
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
            rows="2" maxLength="200" />
        </div>
        <button type="submit" disabled={loading}
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
