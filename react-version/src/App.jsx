import React, { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import WalletConnect from './components/WalletConnect';
import Leaderboard from './components/Leaderboard';
import GameCanvas from './components/GameCanvas';
import Particles from './components/Particles';

/**
 * Main App Component
 * Manages application state and screen flow:
 * 1. Splash Screen (Connect Wallet)
 * 2. Menu Screen (Start Game / Leaderboard)
 * 3. Game Screen (Unity Canvas)
 * 4. Leaderboard Modal (Overlay)
 */
function App() {
  // Wallet state from custom hook
  const {
    walletAddress,
    truncatedAddress,
    isConnecting,
    isConnected,
    error: walletError,
    connectWallet,
  } = useWallet();

  // Screen state
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'menu' | 'game'
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      // Transition to menu screen after successful connection
      setTimeout(() => {
        setCurrentScreen('menu');
      }, 300);
    }
  };

  /**
   * Handle game start
   */
  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  /**
   * Handle leaderboard open
   */
  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
  };

  /**
   * Handle leaderboard close
   */
  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Particle Animation Background */}
      <Particles />

      {/* Wallet Address Display (Top Right) */}
      {isConnected && (
        <div
          className={`fixed top-5 right-5 z-[1000] px-5 py-3 text-xs font-bold
                      transition-all duration-400
                      ${currentScreen !== 'splash' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
          style={{
            background: 'linear-gradient(135deg, #0A1628 0%, #1a2d4d 100%)',
            border: '4px solid #ffd700',
            color: '#ffd700',
            textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)',
            boxShadow: '0 4px 0 #f59e0b, 0 8px 20px rgba(255, 215, 0, 0.4)',
            imageRendering: 'pixelated',
          }}
        >
          {truncatedAddress}
        </div>
      )}

      {/* Splash Screen: Connect Wallet */}
      {currentScreen === 'splash' && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={walletError}
        />
      )}

      {/* Menu Screen: Start Game + Leaderboard */}
      {currentScreen === 'menu' && (
        <div className="fixed inset-0 flex items-center justify-center p-5">
          <div className="max-w-2xl w-full flex flex-col items-center gap-8 fade-in">
            {/* Title */}
            <h2
              className="text-3xl md:text-4xl font-pixel text-zerion-yellow"
              style={{ 
                textShadow: '3px 3px 0 rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5)' 
              }}
            >
              READY?
            </h2>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="pixel-button-primary"
            >
              Start Game
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={handleOpenLeaderboard}
              className="pixel-button-secondary"
            >
              Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Game Screen: Unity Canvas */}
      <GameCanvas
        walletAddress={walletAddress}
        isVisible={currentScreen === 'game'}
      />

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={handleCloseLeaderboard}
      />

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 left-2 text-xs opacity-50 font-mono bg-black/50 p-2 rounded z-[9999]">
          <div>Screen: {currentScreen}</div>
          <div>Wallet: {isConnected ? '✅' : '❌'}</div>
          <div>Address: {truncatedAddress || 'Not connected'}</div>
        </div>
      )}
    </div>
  );
}

export default App;