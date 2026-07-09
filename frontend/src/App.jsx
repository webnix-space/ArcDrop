// ============================================
// ArcDrop Frontend - Complete App
// Login → Wallet → Send Tips → Bridge
// ============================================

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { 
  Zap, Shield, Globe, Wallet, Send, Copy, Check, 
  AlertCircle, Loader, Droplets, ArrowRightLeft,
  LogIn, User, History, ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://arcdrop-api.onrender.com';
const ARC_CHAIN_ID = '0x4CEF52';
const ARC_RPC = 'https://rpc.testnet.arc.network';

export default function App() {
  const [view, setView] = useState('landing'); // landing | login | dashboard | send | bridge | history
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [txHistory, setTxHistory] = useState([]);

  // Send tip form
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1.00');
  const [message, setMessage] = useState('');

  // Bridge form
  const [fromChain, setFromChain] = useState('ethereum');
  const [bridgeAmount, setBridgeAmount] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('arcdrop_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setView('dashboard');
      fetchBalance(parsed.walletId);
      fetchHistory(parsed.walletId);
    }
  }, []);

  const fetchBalance = async (walletId) => {
    try {
      const res = await axios.get(`${API_URL}/api/wallet/${walletId}/balance`);
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  };

  const fetchHistory = async (walletId) => {
    try {
      const res = await axios.get(`${API_URL}/api/wallet/${walletId}/transactions`);
      setTxHistory(res.data.transactions || []);
    } catch (err) {
      console.error('History fetch failed:', err);
    }
  };

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('arcdrop_user', JSON.stringify(userData));
      setView('dashboard');
      fetchBalance(userData.walletId);
      fetchHistory(userData.walletId);
      setSuccess(res.data.isNew ? 'Wallet created successfully!' : 'Welcome back!');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTip = async () => {
    if (!recipient || !amount) {
      setError('Please fill all fields');
      return;
    }
    if (!ethers.isAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }
    if (parseFloat(balance) < parseFloat(amount)) {
      setError('Insufficient USDC balance. Get test USDC from faucet.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/tip/send`, {
        fromWalletId: user.walletId,
        toAddress: recipient,
        amount,
        message
      });
      setSuccess(`Tip sent! TX: ${res.data.transactionId.slice(0, 12)}...`);
      fetchBalance(user.walletId);
      fetchHistory(user.walletId);
      setRecipient('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send tip');
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/bridge/to-arc`, {
        fromChain,
        amount: bridgeAmount,
        destinationAddress: user.address
      });
      setSuccess(`Bridge initiated! ${res.data.estimatedTime}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Bridge failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    setSuccess('Address copied!');
  };

  const logout = () => {
    localStorage.removeItem('arcdrop_user');
    setUser(null);
    setView('landing');
  };

  // ============================================
  // LANDING PAGE
  // ============================================
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold">ArcDrop</span>
          </div>
          <button 
            onClick={() => setView('login')}
            className="bg-emerald-500 hover:bg-emerald-600 px-5 py-2 rounded-full font-medium transition"
          >
            Get Started
          </button>
        </nav>

        {/* Hero */}
        <div className="px-6 pt-12 pb-8">
          <div className="bg-[#1a1f2e] rounded-2xl p-8">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Live on Arc Testnet
            </span>
            <h1 className="text-4xl font-bold mb-4">
              Micro-tipping with <span className="text-emerald-400">nanopayments</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Send instant USDC tips on Arc. No gas fees. No seed phrases. 
              Built with Circle Programmable Wallets & Gas Station.
            </p>
            <button 
              onClick={() => setView('login')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 transition"
            >
              <Droplets className="w-5 h-5" />
              Send a Tip
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 space-y-4 pb-8">
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />} 
            title="Gasless Tipping" 
            desc="Circle Gas Station sponsors all transaction fees. Users never need native tokens."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6" />} 
            title="MPC Security" 
            desc="Multi-party computation secures keys. No seed phrases, no key loss."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6" />} 
            title="Arc Testnet" 
            desc="Built on Arc Chain ID 5042002 with USDC at internet scale."
          />
        </div>
      </div>
    );
  }

  // ============================================
  // LOGIN PAGE
  // ============================================
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <button onClick={() => setView('landing')} className="text-gray-400 mb-6 flex items-center gap-1">
            ← Back
          </button>
          <div className="bg-[#1a1f2e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold">ArcDrop</span>
            </div>
            <p className="text-gray-400 mb-8">Login with email to access your wallet</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Creating Wallet...' : 'Login / Create Wallet'}
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-6 text-center">
              New? We'll create a wallet automatically.<br/>
              Existing? We'll load your wallet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // DASHBOARD
  // ============================================
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        {/* Header */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-emerald-400" />
            <span className="font-bold">ArcDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button onClick={logout} className="text-gray-400 hover:text-white text-sm">Logout</button>
          </div>
        </nav>

        <div className="px-6 py-6 space-y-4">
          {/* Wallet Card */}
          <div className="bg-[#1a1f2e] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your Wallet</p>
                  <p className="font-mono text-sm">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
                </div>
              </div>
              <button onClick={copyAddress} className="text-gray-400 hover:text-emerald-400">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-3xl font-bold text-emerald-400">{parseFloat(balance).toFixed(2)} USDC</p>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                Gasless
              </span>
            </div>
            {parseFloat(balance) === 0 && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-400 text-sm">
                <p>💡 No USDC? Get free test tokens from the <a href="https://faucet.circle.com" target="_blank" className="underline">Circle Faucet</a></p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setView('send')}
              className="bg-emerald-500 hover:bg-emerald-600 p-4 rounded-xl flex flex-col items-center gap-2 transition"
            >
              <Send className="w-6 h-6" />
              <span className="font-semibold">Send Tip</span>
            </button>
            <button 
              onClick={() => setView('bridge')}
              className="bg-[#1a1f2e] hover:bg-[#252b3d] border border-gray-700 p-4 rounded-xl flex flex-col items-center gap-2 transition"
            >
              <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
              <span className="font-semibold">Bridge</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1f2e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Recent Tips
              </h3>
              <button onClick={() => fetchHistory(user.walletId)} className="text-sm text-emerald-400">Refresh</button>
            </div>
            {txHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tips sent yet</p>
            ) : (
              <div className="space-y-2">
                {txHistory.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm">To: {tx.to?.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">{tx.status}</p>
                    </div>
                    <span className="text-emerald-400 font-medium">-{tx.amount} USDC</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // SEND TIP PAGE
  // ============================================
  if (view === 'send') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <nav className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
          <button onClick={() => setView('dashboard')} className="text-gray-400">←</button>
          <span className="font-bold text-lg">Send Tip</span>
        </nav>

        <div className="px-6 py-6 space-y-4">
          {/* Wallet Summary */}
          <div className="bg-[#1a1f2e] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Your Wallet</p>
              <p className="font-mono text-sm">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-xl font-bold text-emerald-400">{parseFloat(balance).toFixed(2)} USDC</p>
            </div>
          </div>

          {/* Send Form */}
          <div className="bg-[#1a1f2e] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Send Tip</h3>
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                Gasless
              </span>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.00"
                step="0.01"
                min="0.01"
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex gap-2 mt-2">
                {['0.50', '1.00', '2.00', '5.00', '10.00'].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      amount === amt 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-[#0a0e1a] text-gray-400 border border-gray-700'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Thanks for the great content!"
                maxLength={200}
                rows={3}
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
              <p className="text-right text-xs text-gray-500 mt-1">{message.length}/200</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-sm">
                <Check className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <button
              onClick={handleSendTip}
              disabled={loading || parseFloat(balance) < parseFloat(amount)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'Sending...' : `Send ${amount} USDC`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // BRIDGE PAGE
  // ============================================
  if (view === 'bridge') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <nav className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
          <button onClick={() => setView('dashboard')} className="text-gray-400">←</button>
          <span className="font-bold text-lg">Bridge to Arc</span>
        </nav>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-[#1a1f2e] rounded-2xl p-6 space-y-4">
            <p className="text-gray-400 text-sm">
              Bridge USDC from any supported chain to Arc Testnet with minimal fees via CCTP.
            </p>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">From Chain</label>
              <select
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ethereum">Ethereum</option>
                <option value="avalanche">Avalanche</option>
                <option value="optimism">Optimism</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
                <option value="polygon">Polygon</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Amount (USDC)</label>
              <input
                type="number"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                placeholder="10.00"
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="bg-[#0a0e1a] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Destination</span>
                <span className="font-mono">{user.address.slice(0, 8)}...{user.address.slice(-4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee</span>
                <span className="text-emerald-400">~$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. Time</span>
                <span>5-15 min</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <button
              onClick={handleBridge}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
              {loading ? 'Initiating...' : 'Bridge to Arc'}
            </button>
          </div>

          <div className="bg-[#1a1f2e] rounded-xl p-4">
            <p className="text-sm text-gray-400">
              💡 <strong>Tip:</strong> For testing, use the <a href="https://faucet.circle.com" target="_blank" className="text-emerald-400 underline">Circle Faucet</a> to get free USDC on Arc Testnet directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Feature Card Component
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl p-6">
      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
