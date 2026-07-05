import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ArcDrop</h1>
      <p className="text-gray-400">Nanopayments micro-tipping on Arc Testnet</p>
      <Link to="/send" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
        Send Tip
      </Link>
    </div>
  )
}
