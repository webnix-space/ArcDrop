import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader, Droplets, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function History() {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const wallet = JSON.parse(localStorage.getItem('arcdrop_wallet') || 'null')

  useEffect(() => {
    if (wallet?.address) fetchHistory()
    else setLoading(false)
  }, [wallet])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tips/received/${wallet.address}`)
      if (res.data.success) setTips(res.data.tips)
    } catch (err) {
      console.error('History error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) {
    return (
      <div className="card bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Wallet Connected</h2>
        <p className="text-gray-400">Go to Send Tip and create a wallet first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transaction History</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Received</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{tips.length} tips</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Volume</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {tips.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)} USDC
          </p>
        </div>
      </div>

      {/* Tips list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : tips.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Droplets className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No tips received yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">From {tip.sender.slice(0, 6)}...{tip.sender.slice(-4)}</p>
                    <p className="text-xs text-gray-500">{tip.message || 'No message'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">+{parseFloat(tip.amount).toFixed(2)} USDC</p>
                  <p className="text-xs text-gray-600">{new Date(tip.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
