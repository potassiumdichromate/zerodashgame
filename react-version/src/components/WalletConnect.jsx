import React from 'react';

/**
 * WalletConnect Component
 * Displays the initial splash screen with game logo and Zerion wallet connection
 * EXCLUSIVE: Only accepts Zerion wallet - other wallets are rejected
 * Shows download instructions if Zerion is not installed
 * 
 * @param {Object} props
 * @param {Function} props.onConnect - Callback when Zerion wallet connects
 * @param {boolean} props.isConnecting - Loading state
 * @param {string} props.error - Error message if connection fails
 */
export default function WalletConnect({ onConnect, isConnecting, error }) {
  // Zerion download URL
  const ZERION_DOWNLOAD_URL = 'https://zerion.io/download';

  // Determine if error is about Zerion installation
  const isZerionNotInstalled = error === 'ZERION_NOT_INSTALLED';
  const isWrongWallet = error === 'ONLY_ZERION_ALLOWED';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5">
      <div className="max-w-2xl w-full text-center fade-in">
        {/* Game Logo */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-pixel text-zerion-yellow mb-10 animate-logo-float"
          style={{
            textShadow: `
              4px 4px 0 #f59e0b,
              8px 8px 0 rgba(0, 0, 0, 0.4),
              0 0 20px rgba(255, 215, 0, 0.8),
              0 0 40px rgba(255, 215, 0, 0.4)
            `,
            letterSpacing: '2px',
          }}
        >
          ZERO DASH
        </h1>

        {/* Game Subtitle */}
        <p 
          className="text-xs md:text-sm font-pixel text-zerion-blue-light mb-16"
          style={{ textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)' }}
        >
          Zerion 🤝 Kult Games
        </p>

        {/* Zerion Not Installed Message */}
        {isZerionNotInstalled && (
          <div className="mb-8 p-6 bg-zerion-blue-dark/90 border-4 border-zerion-yellow rounded-lg">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto mb-4 text-zerion-yellow"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-pixel text-zerion-yellow mb-2">
                Zerion Wallet Required
              </h3>
              <p className="text-sm text-zerion-light mb-4">
                This game exclusively uses Zerion wallet. Please install it to continue.
              </p>
            </div>
            <a
              href={ZERION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pixel-button-primary mb-2"
            >
              Download Zerion
            </a>
            <p className="text-xs text-zerion-light/60 mt-2">
              After installing, refresh this page
            </p>
          </div>
        )}

        {/* Wrong Wallet Detected Message */}
        {isWrongWallet && (
          <div className="mb-8 p-6 bg-zerion-blue-dark/90 border-4 border-zerion-yellow rounded-lg">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto mb-4 text-zerion-yellow"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-pixel text-zerion-yellow mb-2">
                Zerion Wallet Only
              </h3>
              <p className="text-sm text-zerion-light mb-4">
                We detected a different wallet. Please use Zerion wallet exclusively for this game.
              </p>
            </div>
            <a
              href={ZERION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pixel-button-primary mb-2"
            >
              Get Zerion Wallet
            </a>
            <p className="text-xs text-zerion-light/60 mt-2">
              Switch to Zerion wallet in your browser
            </p>
          </div>
        )}

        {/* Connect Wallet Button */}
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="pixel-button-primary"
        >
          {isConnecting ? (
            <>
              Connecting
              <span className="loading-spinner" />
            </>
          ) : (
            'Connect Zerion Wallet'
          )}
        </button>

        {/* General Error Message (not Zerion-specific) */}
        {error && !isZerionNotInstalled && !isWrongWallet && (
          <div 
            className="mt-8 p-5 bg-red-900/90 border-4 border-red-500 text-sm animate-shake rounded"
            style={{ textShadow: '1px 1px 0 rgba(0, 0, 0, 0.8)' }}
          >
            {error}
          </div>
        )}

        {/* Instructions */}
        {!error && (
          <div className="mt-8">
            <p className="text-xs opacity-60 text-zerion-light mb-3">
              Connect your Zerion wallet to start playing
            </p>
            <a
              href={ZERION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zerion-yellow hover:text-zerion-yellow-glow underline"
            >
              Don't have Zerion? Download here
            </a>
          </div>
        )}
      </div>
    </div>
  );
}