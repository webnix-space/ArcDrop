import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import SendTip from './pages/SendTip.jsx'
import History from './pages/History.jsx'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send" element={<SendTip />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Layout>
  )
}

export default App
