import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { Buffer } from 'buffer';
import App from './App.jsx';
import './index.css';

window.Buffer = Buffer;

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const hasValidPrivyAppId =
  typeof privyAppId === 'string' && privyAppId.trim().length > 0;

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
};

if (!privyAppId) {
  console.warn('VITE_PRIVY_APP_ID not set — Privy disabled');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasValidPrivyAppId ? (
      <PrivyProvider appId={privyAppId} config={privyConfig}>
        <BrowserRouter>
          <App privyEnabled />
        </BrowserRouter>
      </PrivyProvider>
    ) : (
      <BrowserRouter>
        <App privyEnabled={false} />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
