import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';

import WalletConnect from './components/WalletConnect';
import Leaderboard from './components/Leaderboard';
import GameCanvas from './components/GameCanvas';
import RealTimeLeaderboardSidebar from './components/RealTimeLeaderboardSidebar';
import UserProfileSidebar from './components/UserProfileSidebar';
import CharacterMarketplace from './components/CharacterMarketplace';
import DailyMissions from './components/DailyMissions';
import NFTPassStatus from './components/NFTPassStatus';
import Particles from './components/Particles';
import Login from './components/Login';
import LoginModal from './components/LoginModal';

function GameRoot({ privyEnabled }) {
  const {
    walletAddress,
    truncatedAddress,
    isConnecting,
    isConnected,
    error,
    connectWallet,
  } = useWallet();

  /**
   * Screen state
   * splash | menu | leaderboard | game
   */
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const [privyWalletAddress, setPrivyWalletAddress] = useState(null);

  const effectiveWallet = walletAddress || privyWalletAddress;

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setTimeout(() => {
        setCurrentScreen(prev => (prev === 'game' ? 'game' : 'menu'));
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Particles />

      {/* Wallet badge */}
      {isConnected && (
        <div className="fixed top-5 right-5 z-[1000] px-5 py-3 text-xs font-bold bg-black border-4 border-yellow-400 text-yellow-400">
          {truncatedAddress}
        </div>
      )}

      {/* ================= SPLASH ================= */}
      {currentScreen === 'splash' && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={error}
          onPrivyConnect={privyEnabled ? () => setShowPrivyLogin(true) : undefined}
        />
      )}

      {/* ================= MENU ================= */}
      {currentScreen === 'menu' && (
        <>
          <NFTPassStatus walletAddress={effectiveWallet} />
          <CharacterMarketplace />
          <DailyMissions />

          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <div className="flex flex-col gap-4">
              <button
                className="pixel-button-primary"
                disabled={!effectiveWallet}
                onClick={() => setCurrentScreen('game')}
              >
                🎮 START GAME
              </button>

              <button
                className="pixel-button-secondary"
                onClick={() => setCurrentScreen('leaderboard')}
              >
                🏆 LEADERBOARD
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= LEADERBOARD (NEW SCREEN) ================= */}
      {currentScreen === 'leaderboard' && (
        <Leaderboard
          onClose={() => setCurrentScreen('menu')}
        />
      )}

      {/* ================= GAME ================= */}
      <GameCanvas
        walletAddress={effectiveWallet}
        isVisible={currentScreen === 'game'}
        onBack={() => setCurrentScreen('menu')}
      />

      <RealTimeLeaderboardSidebar
        isVisible={currentScreen === 'game'}
        currentUserAddress={truncatedAddress}
      />

      <UserProfileSidebar
        isVisible={currentScreen === 'game'}
        walletAddress={walletAddress}
      />

      {/* ================= PRIVY LOGIN ================= */}
      {privyEnabled && (
        <LoginModal
          open={showPrivyLogin}
          onClose={() => setShowPrivyLogin(false)}
          onAuthenticated={(addr) => {
            setPrivyWalletAddress(addr || null);
            setShowPrivyLogin(false);
            setCurrentScreen(prev => (prev === 'game' ? 'game' : 'menu'));
          }}
        />
      )}
    </div>
  );
}

/* ================= ROUTER ================= */

export default function App({ privyEnabled = true }) {
  return (
    <Routes>
      <Route path="/" element={<GameRoot privyEnabled={privyEnabled} />} />
      {privyEnabled && <Route path="/login" element={<Login />} />
      <Route path="*" element={<GameRoot privyEnabled={privyEnabled} />} />
    </Routes>
  );
}
