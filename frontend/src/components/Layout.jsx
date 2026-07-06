import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Send, Trophy, Wallet, LogOut, Droplets } from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const wallet = JSON.parse(localStorage.getItem('arcdrop_wallet') || 'null')

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/send', icon: Send, label: 'Send Tip' },
    { path: '/history', icon: Trophy, label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-green-400" />
            <span className="font-bold text-lg">ArcDrop</span>
          </Link>
          {wallet && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-sm font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="space-y-1 sticky top-20">
            {navItems.map(item => {
              const active = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            {wallet && (
              <button onClick={() => { localStorage.removeItem('arcdrop_wallet'); window.location.reload() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all mt-4">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Disconnect</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
