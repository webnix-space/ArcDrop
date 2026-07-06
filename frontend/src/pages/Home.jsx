import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Zap, Shield, Globe, ArrowRight, Wallet, Droplets, TrendingUp } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function Home() {
  const [contractInfo, setContractInfo] = useState(null)
  const wallet = JSON.parse(localStorage.getItem('arcdrop_wallet') || 'null')

  useEffect(() => {
    fetchContractInfo()
  }, [])

  const fetchContractInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE}/contract/info`)
      if (res.data.success) setContractInfo(res.data.contract)
    } catch (err) {}
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-8">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>Live on Arc Testnet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Micro-tipping with <span className="text-green-400">nanopayments</span></h1>
          <p className="text-gray-400 max-w-xl mb-6">
            Send instant USDC tips on Arc. No gas fees. No seed phrases. Built with Circle Programmable Wallets & Gas Station.
          </p>
          {wallet ? (
            <Link to="/send" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Droplets className="w-5 h-5" />
              Send a Tip
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link to="/send" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Wallet className="w-5 h-5" />
              Create Wallet
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {contractInfo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-sm mb-1">Chain ID</p>
            <p className="text-xl font-bold text-white">{contractInfo.chainId}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-sm mb-1">Min Tip</p>
            <p className="text-xl font-bold text-green-400">{contractInfo.minTipAmount} USDC</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-sm mb-1">Platform Fee</p>
            <p className="text-xl font-bold text-blue-400">{contractInfo.platformFeePercent || (contractInfo.platformFeeBps / 100) + '%'}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-sm mb-1">USDC Contract</p>
            <p className="text-xl font-bold text-white font-mono text-sm">{contractInfo.usdcAddress.slice(0, 6)}...</p>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-bold text-lg mb-2">Gasless Tipping</h3>
          <p className="text-gray-400 text-sm">Circle Gas Station sponsors all transaction fees. Users never need native tokens.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-bold text-lg mb-2">MPC Security</h3>
          <p className="text-gray-400 text-sm">Multi-party computation secures keys. No seed phrases, no key loss.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-bold text-lg mb-2">Arc Testnet</h3>
          <p className="text-gray-400 text-sm">Built on Arc Chain ID 5042002 with USDC at internet scale.</p>
        </div>
      </div>

      {/* Wallet status */}
      {wallet && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Your Wallet</p>
                <p className="font-mono text-sm">{wallet.address}</p>
              </div>
            </div>
            <Link to="/send" className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors">
              Send Tip
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
