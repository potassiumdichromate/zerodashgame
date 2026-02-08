import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from './hooks/useWallet';
import { BlockchainToastProvider } from './context/BlockchainToastContext'; // NEW IMPORT
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
import AIBotMike from './components/AIBotMike';
import BackgroundMusic from './components/BackgroundMusic';
import desktopBg from './assets/bg.png';
import mobileBg from './assets/dbg.png';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

function HomeBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-center bg-cover bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${mobileBg})` }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 hidden bg-center bg-cover bg-no-repeat md:block"
        style={{ backgroundImage: `url(${desktopBg})` }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/55 to-black/80"
      />
    </>
  );
}

/**
 * Main game experience (existing Zero Dash flow)
 */
function GameRoot({ privyEnabled }) {
  // Wallet state from custom hook
  const {
    walletAddress,
    truncatedAddress,
    isConnecting,
    isConnected,
    error: walletError,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const { logout: privyLogout } = usePrivy();

  // Screen state
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'menu' | 'game'
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const [privyWalletAddress, setPrivyWalletAddress] = useState(null);
  const [copied, setCopied] = useState(false);

  // Player stats state
  const [playerStats, setPlayerStats] = useState({
    bestScore: 0,
    totalCoins: 0,
    rank: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  /**
   * Fetch player stats from backend
   */
  const fetchPlayerStats = async () => {
    setStatsLoading(true);

    try {
      // Get wallet address from localStorage
      const storedWalletAddress = localStorage.getItem('walletAddress');
      
      if (!storedWalletAddress) {
        console.log('No wallet address found in storage');
        setStatsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/player/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedWalletAddress}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player stats');
      }

      const data = await response.json();
      
      // Update stats with real data from backend
      setPlayerStats({
        bestScore: data.highScore || 0,
        totalCoins: data.coins || 0,
        rank: 0, // This would need to be calculated from leaderboard
      });
    } catch (err) {
      console.error('Error fetching player stats:', err);
      // Keep default stats on error
      setPlayerStats({
        bestScore: 0,
        totalCoins: 0,
        rank: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Fetch player rank from leaderboard
   */
  const fetchPlayerRank = async () => {
    try {
      const storedWalletAddress = localStorage.getItem('walletAddress');
      if (!storedWalletAddress) return;

      const response = await fetch(`${BACKEND_URL}/player/leaderboard?limit=1000`);
      
      if (!response.ok) return;

      const leaderboard = await response.json();
      
      // Find current player's rank
      const playerIndex = leaderboard.findIndex(
        player => player.walletAddress.toLowerCase() === storedWalletAddress.toLowerCase()
      );
      
      if (playerIndex !== -1) {
        setPlayerStats(prev => ({
          ...prev,
          rank: playerIndex + 1,
        }));
      }
    } catch (err) {
      console.error('Error fetching player rank:', err);
    }
  };

  /**
   * Fetch stats when menu screen is shown
   */
  useEffect(() => {
    if (currentScreen === 'menu') {
      fetchPlayerStats();
      fetchPlayerRank();
    }
  }, [currentScreen]);

  /**
   * Handle logout - properly resets all state without page reload
   */
  const handleLogout = async () => {
    disconnectWallet();
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('privySession');
    try {
      await privyLogout();
    } catch {}
    setPrivyWalletAddress(null);
    setCurrentScreen('splash');
    setShowLeaderboard(false);
  };

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
   * Handle back to menu from game
   */
  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    // Refresh stats when returning to menu
    fetchPlayerStats();
    fetchPlayerRank();
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
    <div className="relative w-full h-screen overflow-hidden">
      <HomeBackground />

      {/* Particle Animation Background */}
      <Particles />

      {/* Background Music - Plays on splash and menu, stops on game */}
      <BackgroundMusic 
        isPlaying={currentScreen !== 'game'} 
      />

      {/* Wallet Address + Logout (Top Right) */}
      {(isConnected || privyWalletAddress) && currentScreen !== 'splash' && (
        <div
          className="fixed top-5 right-5 z-[1000] flex items-center gap-2 transition-all duration-400 opacity-100 translate-y-0"
        >
          <div
            className="px-5 py-3 text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            title="Click to copy address"
            onClick={() => {
              const fullAddress = walletAddress || privyWalletAddress;
              if (fullAddress) {
                navigator.clipboard.writeText(fullAddress);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #0A1628 0%, #1a2d4d 100%)',
              border: '4px solid #ffd700',
              color: '#ffd700',
              textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)',
              boxShadow: '0 4px 0 #f59e0b, 0 8px 20px rgba(255, 215, 0, 0.4)',
              imageRendering: 'pixelated',
            }}
          >
            {copied ? 'Copied!' : (truncatedAddress || `${privyWalletAddress?.slice(0, 6)}...${privyWalletAddress?.slice(-4)}`)}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-3 text-xs font-pixel font-bold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0A1628 0%, #1a2d4d 100%)',
              border: '4px solid #ffd700',
              color: '#ffd700',
              textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)',
              boxShadow: '0 4px 0 #f59e0b, 0 8px 20px rgba(255, 215, 0, 0.4)',
              imageRendering: 'pixelated',
            }}
          >
            LOGOUT
          </button>
        </div>
      )}

      {/* Splash Screen: Connect Wallet */}
      {currentScreen === 'splash' && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={walletError}
          onPrivyConnect={
            privyEnabled ? () => setShowPrivyLogin(true) : undefined
          }
        />
      )}

      {/* Enhanced Menu Screen: NFT Status + Marketplace + Ready + Missions */}
      {currentScreen === 'menu' && !showLeaderboard && (
        <>
          {/* Top: NFT Pass Status */}
          <NFTPassStatus walletAddress={walletAddress || privyWalletAddress} />

          {/* Left: Character Marketplace */}
          <CharacterMarketplace />

          {/* Center: Ready Buttons */}
          <div className="fixed inset-0 flex items-center justify-center p-5 z-[100]">
            <div className="max-w-md w-full flex flex-col items-center gap-6 fade-in">
              {/* Title */}
              <h2
                className="text-4xl md:text-5xl font-pixel text-zerion-yellow"
                style={{ 
                  textShadow: '4px 4px 0 rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6)' 
                }}
              >
                READY?
              </h2>

              {/* Start Game Button */}
              <button
                onClick={handleStartGame}
                className="pixel-button-primary w-full text-lg"
              >
                🎮 START GAME
              </button>

              {/* Leaderboard Button */}
              <button
                onClick={handleOpenLeaderboard}
                className="pixel-button-secondary w-full"
              >
                🏆 LEADERBOARD
              </button>

              {/* Quick Stats - Real Data from Backend */}
              <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                {/* Best Score */}
                <div className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                  <p className="text-xs font-pixel text-zerion-blue-light mb-1">BEST</p>
                  {statsLoading ? (
                    <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <p className="text-lg font-pixel text-zerion-yellow font-bold">
                      {playerStats.bestScore > 0 
                        ? playerStats.bestScore.toLocaleString() 
                        : '0'
                      }
                    </p>
                  )}
                </div>

                {/* Total Coins */}
                <div className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                  <p className="text-xs font-pixel text-zerion-blue-light mb-1">COINS</p>
                  {statsLoading ? (
                    <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <p className="text-lg font-pixel text-zerion-yellow font-bold">
                      {playerStats.totalCoins > 0 
                        ? playerStats.totalCoins.toLocaleString() 
                        : '0'
                      }
                    </p>
                  )}
                </div>

                {/* Global Rank */}
                <div className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                  <p className="text-xs font-pixel text-zerion-blue-light mb-1">RANK</p>
                  {statsLoading ? (
                    <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <p className="text-lg font-pixel text-zerion-yellow font-bold">
                      {playerStats.rank > 0 ? `#${playerStats.rank}` : '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Refresh Stats Button */}
              {!statsLoading && (
                <button
                  onClick={() => {
                    fetchPlayerStats();
                    fetchPlayerRank();
                  }}
                  className="text-xs font-pixel text-zerion-blue-light hover:text-zerion-yellow transition-colors"
                >
                  🔄 Refresh Stats
                </button>
              )}
            </div>
          </div>

          {/* Right: Daily Missions */}
          <DailyMissions />
        </>
      )}

      {/* Game Screen: Unity Canvas with Sidebars */}
      {currentScreen === 'game' && (
        <>
          {/* Left Sidebar: Real-time Leaderboard */}
          <RealTimeLeaderboardSidebar
            isVisible={currentScreen === 'game'}
            currentUserAddress={truncatedAddress}
          />

          {/* Center: Game Canvas */}
          <GameCanvas
            walletAddress={walletAddress || privyWalletAddress}
            isVisible={currentScreen === 'game'}
            onBack={handleBackToMenu}
          />

          {/* Right Sidebar: User Profile */}
          <UserProfileSidebar
            isVisible={currentScreen === 'game'}
            walletAddress={walletAddress}
          />
        </>
      )}

      {/* Leaderboard Modal (can be opened from menu) */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={handleCloseLeaderboard}
      />

      {/* AI Bot Mike - Available on Menu and Game Screens */}
      {(currentScreen === 'menu' || currentScreen === 'game') && (
        <AIBotMike />
      )}

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 left-2 text-xs opacity-50 font-mono bg-black/50 p-2 rounded z-[9999]">
          <div>Screen: {currentScreen}</div>
          <div>Wallet: {isConnected ? '✅' : '❌'}</div>
          <div>Address: {truncatedAddress || 'Not connected'}</div>
          <div>Stats: Best={playerStats.bestScore} Coins={playerStats.totalCoins} Rank={playerStats.rank || '-'}</div>
        </div>
      )}

      {privyEnabled && (
        <LoginModal
          open={showPrivyLogin}
          onClose={() => setShowPrivyLogin(false)}
          onAuthenticated={(addr) => {
            setPrivyWalletAddress(addr || null);
            setShowPrivyLogin(false);
            // Mirror normal connect-wallet flow: go to menu
            setCurrentScreen((prev) => (prev === 'game' ? 'game' : 'menu'));
          }}
        />
      )}
    </div>
  );
}

function App({ privyEnabled = true }) {
  return (
    <BlockchainToastProvider> {/* NEW: Wrap entire app */}
      <Routes>
        <Route path="/" element={<GameRoot privyEnabled={privyEnabled} />} />
        {privyEnabled && <Route path="/login" element={<Login />} />}
        {/* Fallback: send any unknown routes back to the main game */}
        <Route path="*" element={<GameRoot privyEnabled={privyEnabled} />} />
      </Routes>
    </BlockchainToastProvider> {/* END NEW */}
  );
}

export default App;
