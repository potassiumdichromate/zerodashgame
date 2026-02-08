import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { BlockchainToastProvider } from './context/BlockchainToastContext' // ADD THIS
import { Buffer } from 'buffer'
import App from './App.jsx'
import './index.css'

window.Buffer = Buffer

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID
const hasValidPrivyAppId =
  typeof privyAppId === 'string' && privyAppId.trim().length > 0

const privyConfig = {
  appearance: {
    theme: 'dark',
    walletChainType: 'ethereum-only',
    walletList: ['zerion'],
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  loginMethods: ['wallet', 'email', 'google'],
}

if (!privyAppId) {
  console.warn('VITE_PRIVY_APP_ID is not set. Privy login will be disabled.')
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ServiceWorker.js').catch(err => {
      console.log('Service Worker registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasValidPrivyAppId ? (
      <PrivyProvider appId={privyAppId} config={privyConfig}>
        <BrowserRouter>
          <BlockchainToastProvider> {/* ADD THIS WRAPPER */}
            <App privyEnabled />
          </BlockchainToastProvider>
        </BrowserRouter>
      </PrivyProvider>
    ) : (
      <BrowserRouter>
        <BlockchainToastProvider> {/* ADD THIS WRAPPER */}
          <App privyEnabled={false} />
        </BlockchainToastProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>,
)
