import React, { useEffect, useState } from 'react';
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

  const [currentScreen, setCurrentScreen] = useState(
    () => localStorage.getItem('ZERO_DASH_SCREEN') || 'splash'
  );
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const [privyWalletAddress, setPrivyWalletAddress] = useState(null);

  useEffect(() => {
    localStorage.setItem('ZERO_DASH_SCREEN', currentScreen);
  }, [currentScreen]);

  const effectiveWallet = walletAddress || privyWalletAddress;

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setCurrentScreen('menu');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Particles />

      {/* Unity always mounted */}
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

      {isConnected && (
        <div className="fixed top-5 right-5 z-[1000] px-4 py-2 text-xs font-bold bg-black border-4 border-yellow-400 text-yellow-400">
          {truncatedAddress}
        </div>
      )}

      {currentScreen === 'splash' && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={error}
          onPrivyConnect={privyEnabled ? () => setShowPrivyLogin(true) : undefined}
        />
      )}

      {currentScreen === 'menu' && (
        <>
          <NFTPassStatus walletAddress={effectiveWallet} />
          <CharacterMarketplace />
          <DailyMissions />

          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <div className="flex flex-col gap-4">
              <button
                className="pixel-button-primary"
                onClick={() => setCurrentScreen('game')}
              >
                🎮 START GAME
              </button>
              <button
                className="pixel-button-secondary"
                onClick={() => setShowLeaderboard(true)}
              >
                🏆 LEADERBOARD
              </button>
            </div>
          </div>
        </>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      {privyEnabled && (
        <LoginModal
          open={showPrivyLogin}
          onClose={() => setShowPrivyLogin(false)}
          onAuthenticated={(addr) => {
            setPrivyWalletAddress(addr);
            setShowPrivyLogin(false);
            setCurrentScreen('menu');
          }}
        />
      )}
    </div>
  );
}

export default function App({ privyEnabled = true }) {
  return (
    <Routes>
      {privyEnabled && <Route path="/login" element={<Login />} />}
      <Route path="/*" element={<GameRoot privyEnabled={privyEnabled} />} />
    </Routes>
  );
}
