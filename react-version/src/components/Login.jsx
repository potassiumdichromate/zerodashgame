import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginModal from './LoginModal'

function Login() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="text-xs md:text-sm font-pixel px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
        >
          ← Back to game
        </Link>
      </div>

      <div className="max-w-md w-full text-center px-4">
        <h1
          className="text-4xl md:text-5xl font-pixel text-zerion-yellow mb-6"
          style={{
            textShadow:
              '4px 4px 0 #f59e0b, 8px 8px 0 rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.8)',
          }}
        >
          ZERO DASH
        </h1>

        <p className="text-xs md:text-sm text-zerion-blue-light mb-10">
          Login with Privy to link your wallet and start your temple escape run.
        </p>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="pixel-button-primary w-full max-w-xs mx-auto"
        >
          Connect Wallet
        </button>
      </div>

      <LoginModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default Login

