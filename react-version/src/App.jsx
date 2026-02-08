import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from './hooks/useWallet';
import { BlockchainToastProvider, useBlockchainToast } from './context/BlockchainToastContext';
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

// WRAP GameRoot CONTENT IN A NEW COMPONENT
function GameRootContent({ privyEnabled }) {
  const { showToast } = useBlockchainToast(); // NOW THIS WILL WORK!
  
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

  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const [privyWalletAddress, setPrivyWalletAddress] = useState(null);
  const [copied, setCopied] = useState(false);

  const [playerStats, setPlayerStats] = useState({
    bestScore: 0,
    totalCoins: 0,
    rank: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchPlayerStats = async () => {
    setStatsLoading(true);

    try {
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
      
      setPlayerStats({
        bestScore: data.highScore || 0,
        totalCoins: data.coins || 0,
        rank: 0,
      });

      // Show toast if blockchain session was recorded
      if (data.blockchain?.txHash) {
        showToast({
          title: '🎮 Session Recorded',
          description: 'Your game session was tracked on blockchain',
          txHash: data.blockchain.txHash,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setPlayerStats({
        bestScore: 0,
        totalCoins: 0,
        rank: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPlayerRank = async () => {
    try {
      const storedWalletAddress = localStorage.getItem('walletAddress');
      if (!storedWalletAddress) return;

      const response = await fetch(`${BACKEND_URL}/player/leaderboard?limit=1000`);
      
      if (!response.ok) return;

      const leaderboard = await response.json();
      
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

  useEffect(() => {
    if (currentScreen === 'menu') {
      fetchPlayerStats();
      fetchPlayerRank();
    }
  }, [currentScreen]);

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

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setTimeout(() => {
        setCurrentScreen('menu');
      }, 300);
    }
  };

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    fetchPlayerStats();
    fetchPlayerRank();
  };

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <HomeBackground />
      <Particles />
      <BackgroundMusic isPlaying={currentScreen !== 'game'} />

      {(isConnected || privyWalletAddress) && currentScreen !== 'splash' && (
        <div className="fixed top-5 right-5 z-[1000] flex items-center gap-2 transition-all duration-400 opacity-100 translate-y-0">
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

      {currentScreen === 'splash' && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={walletError}
          onPrivyConnect={privyEnabled ? () => setShowPrivyLogin(true) : undefined}
        />
      )}

      {currentScreen === 'menu' && !showLeaderboard && (
        <>
          <NFTPassStatus walletAddress={walletAddress || privyWalletAddress} />
          <CharacterMarketplace />
          
          <div className="fixed inset-0 flex items-center justify-center p-5 z-[100]">
            <div className="max-w-md w-full flex flex-col items-center gap-6 fade-in">
              <h2
                className="text-4xl md:text-5xl font-pixel text-zerion-yellow"
                style={{ textShadow: '4px 4px 0 rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6)' }}
              >
                READY?
              </h2>

              <button onClick={handleStartGame} className="pixel-button-primary w-full text-lg">
                🎮 START GAME
              </button>

              <button onClick={handleOpenLeaderboard} className="pixel-button-secondary w-full">
                🏆 LEADERBOARD
              </button>

              <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                <div className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                  <p className="text-xs font-pixel text-zerion-blue-light mb-1">BEST</p>
                  {statsLoading ? (
                    <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <p className="text-lg font-pixel text-zerion-yellow font-bold">
                      {playerStats.bestScore > 0 ? playerStats.bestScore.toLocaleString() : '0'}
                    </p>
                  )}
                </div>

                <div className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                  <p className="text-xs font-pixel text-zerion-blue-light mb-1">COINS</p>
                  {statsLoading ? (
                    <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <p className="text-lg font-pixel text-zerion-yellow font-bold">
                      {playerStats.totalCoins > 0 ? playerStats.totalCoins.toLocaleString() : '0'}
                    </p>
                  )}
                </div>

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

              {!statsLoading && (
                <button
                  onClick={() => { fetchPlayerStats(); fetchPlayerRank(); }}
                  className="text-xs font-pixel text-zerion-blue-light hover:text-zerion-yellow transition-colors"
                >
                  🔄 Refresh Stats
                </button>
              )}
            </div>
          </div>

          <DailyMissions />
        </>
      )}

      {currentScreen === 'game' && (
        <>
          <RealTimeLeaderboardSidebar isVisible={currentScreen === 'game'} currentUserAddress={truncatedAddress} />
          <GameCanvas walletAddress={walletAddress || privyWalletAddress} isVisible={currentScreen === 'game'} onBack={handleBackToMenu} />
          <UserProfileSidebar isVisible={currentScreen === 'game'} walletAddress={walletAddress} />
        </>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={handleCloseLeaderboard} />

      {(currentScreen === 'menu' || currentScreen === 'game') && <AIBotMike />}

      {/* TEST BUTTON */}
      {(currentScreen === 'menu' || currentScreen === 'game') && (
        <button
          onClick={() => {
            console.log('🧪 TEST TOAST CLICKED');
            console.log('🧪 showToast function:', showToast);
            showToast({
              title: '🧪 Test Toast',
              description: 'If you see this, the toast system is working!',
              txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              duration: 10000
            });
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #00d4ff, #7209b7)',
            color: 'white',
            border: '2px solid #00d4ff',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 99998,
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)'
          }}
        >
          🧪 TEST TOAST
        </button>
      )}

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
            setCurrentScreen((prev) => (prev === 'game' ? 'game' : 'menu'));
          }}
        />
      )}
    </div>
  );
}

// SIMPLIFIED GameRoot - just wraps GameRootContent
function GameRoot({ privyEnabled }) {
  return <GameRootContent privyEnabled={privyEnabled} />;
}

function App({ privyEnabled = true }) {
  return (
    <BlockchainToastProvider>
      <Routes>
        <Route path="/" element={<GameRoot privyEnabled={privyEnabled} />} />
        {privyEnabled && <Route path="/login" element={<Login />} />}
        <Route path="*" element={<GameRoot privyEnabled={privyEnabled} />} />
      </Routes>
    </BlockchainToastProvider>
  );
}

export default App;
