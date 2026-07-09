import { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplets, Zap, Send, Wallet, Copy, Check, ArrowRightLeft, LogIn, History, AlertCircle, Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://arcdrop-api.onrender.com';

export default function App() {
  const [view, setView] = useState('landing');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Send form
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1.00');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('arcdrop_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setView('dashboard');
      fetchBalance(parsed.walletId);
    }
  }, []);

  const fetchBalance = async (walletId) => {
    try {
      const res = await axios.get(`${API_URL}/api/wallet/${walletId}/balance`);
      setBalance(res.data.balance);
    } catch (e) { console.error(e); }
  };

  const handleLogin = async () => {
    if (!email.includes('@')) { setError('Valid email'); return; }
    setLoading(true); setError(null);
    try {
      // Step 1: Create/get user
      const userRes = await axios.post(`${API_URL}/api/auth/create-user`, { email });
      const userId = userRes.data.userId;
      console.log('User:', userId);

      // Step 2: Initialize Circle SDK client-side for PIN setup
      // For now, simulate with a session token
      // In production, use @circle-fin/w3s-pw-web-sdk
      const mockUserToken = 'session_' + Date.now();

      // Step 3: Create wallet
      const walletRes = await axios.post(`${API_URL}/api/wallet/create`, { 
        userId, 
        userToken: mockUserToken 
      });

      const userData = {
        email,
        userId,
        walletId: walletRes.data.walletId,
        address: walletRes.data.address,
        userToken: mockUserToken
      };

      setUser(userData);
      localStorage.setItem('arcdrop_user', JSON.stringify(userData));
      setView('dashboard');
      fetchBalance(walletRes.data.walletId);
      setSuccess('Wallet ready!');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!recipient || !amount) { setError('Fill all fields'); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/tip/send`, {
        walletId: user.walletId,
        toAddress: recipient,
        amount,
        userToken: user.userToken
      });
      setSuccess(`Sent! TX: ${res.data.transactionId.slice(0, 12)}`);
      fetchBalance(user.walletId);
      setRecipient(''); setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    setSuccess('Copied!');
  };

  const logout = () => {
    localStorage.removeItem('arcdrop_user');
    setUser(null); setView('landing');
  };

  // LANDING PAGE
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <nav className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold">ArcDrop</span>
          </div>
          <button onClick={() => setView('login')} className="bg-emerald-500 px-5 py-2 rounded-full font-medium">Get Started</button>
        </nav>

        <div className="px-6 pt-12 pb-8">
          <div className="bg-[#1a1f2e] rounded-2xl p-8">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-sm mb-6">
              <Zap className="w-4 h-4" />Live on Arc Testnet
            </span>
            <h1 className="text-4xl font-bold mb-4">Micro-tipping with <span className="text-emerald-400">nanopayments</span></h1>
            <p className="text-gray-400 text-lg mb-8">Send instant USDC tips on Arc. No gas fees. No seed phrases.</p>
            <button onClick={() => setView('login')} className="bg-emerald-500 px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2">
              <Droplets className="w-5 h-5" />Send a Tip →
            </button>
          </div>
        </div>

        <div className="px-6 space-y-4 pb-8">
          <FeatureCard icon={<Zap className="w-6 h-6" />} title="Gasless Tipping" desc="Circle Gas Station sponsors all fees." />
          <FeatureCard icon={<Wallet className="w-6 h-6" />} title="No Seed Phrases" desc="Secure MPC wallets with PIN." />
          <FeatureCard icon={<Droplets className="w-6 h-6" />} title="Arc Testnet" desc="Chain ID 5042002 with USDC." />
        </div>
      </div>
    );
  }

  // LOGIN PAGE
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <button onClick={() => setView('landing')} className="text-gray-400 mb-6">← Back</button>
          <div className="bg-[#1a1f2e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold">ArcDrop</span>
            </div>
            <p className="text-gray-400 mb-8">Login with email</p>

            <div className="space-y-4">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white"
                onKeyPress={e => e.key === 'Enter' && handleLogin()} />

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
              {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm">{success}</div>}

              <button onClick={handleLogin} disabled={loading} 
                className="w-full bg-emerald-500 disabled:opacity-50 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Creating...' : 'Login / Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2"><Droplets className="w-6 h-6 text-emerald-400" /><span className="font-bold">ArcDrop</span></div>
          <button onClick={logout} className="text-gray-400 text-sm">Logout</button>
        </nav>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-[#1a1f2e] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-400">Your Wallet</p>
                <p className="font-mono text-sm">{user.address?.slice(0,6)}...{user.address?.slice(-4)}</p>
              </div>
              <button onClick={copyAddress} className="text-gray-400"><Copy className="w-5 h-5" /></button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-3xl font-bold text-emerald-400">{parseFloat(balance).toFixed(2)} USDC</p>
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm flex items-center gap-1"><Zap className="w-3 h-3"/>Gasless</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setView('send')} className="bg-emerald-500 p-4 rounded-xl flex flex-col items-center gap-2">
              <Send className="w-6 h-6" /><span className="font-semibold">Send Tip</span>
            </button>
            <button onClick={() => setView('bridge')} className="bg-[#1a1f2e] border border-gray-700 p-4 rounded-xl flex flex-col items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-emerald-400" /><span className="font-semibold">Bridge</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SEND PAGE
  if (view === 'send') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <nav className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
          <button onClick={() => setView('dashboard')} className="text-gray-400">←</button>
          <span className="font-bold text-lg">Send Tip</span>
        </nav>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-[#1a1f2e] rounded-xl p-4 flex justify-between">
            <div><p className="text-sm text-gray-400">Balance</p><p className="text-xl font-bold text-emerald-400">{parseFloat(balance).toFixed(2)} USDC</p></div>
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs flex items-center gap-1 h-fit"><Zap className="w-3 h-3"/>Gasless</span>
          </div>

          <div className="bg-[#1a1f2e] rounded-2xl p-6 space-y-4">
            <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient 0x..." 
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono" />

            <div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} 
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white" />
              <div className="flex gap-2 mt-2">
                {['0.50','1.00','2.00','5.00','10.00'].map(a => (
                  <button key={a} onClick={() => setAmount(a)} 
                    className={`px-3 py-1.5 rounded-lg text-sm ${amount === a ? 'bg-emerald-500' : 'bg-[#0a0e1a] border border-gray-700 text-gray-400'}`}>{a}</button>
                ))}
              </div>
            </div>

            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optional)" maxLength={200} rows={2}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white resize-none" />

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm">{success}</div>}

            <button onClick={handleSend} disabled={loading} 
              className="w-full bg-emerald-500 disabled:opacity-50 py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send {amount} USDC
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl p-6">
      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
