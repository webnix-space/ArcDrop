import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SendTip from './pages/SendTip.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 p-4">
        <h1 className="text-xl font-bold text-green-400">ArcDrop</h1>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<SendTip />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
