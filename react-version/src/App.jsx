import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWallet } from './hooks/useWallet';
import { BlockchainToastProvider, useBlockchainToast } from './context/BlockchainToastContext';
import WalletConnect from './components/WalletConnect';
import Leaderboard from './components/Leaderboard';
import GameCanvas from './components/GameCanvas';
import RealTimeLeaderboardSidebar from './components/RealTimeLeaderboardSidebar';
import UserProfileSidebar from './components/UserProfileSidebar';
import Particles from './components/Particles';
import Login from './components/Login';
import LoginModal from './components/LoginModal';
import BackgroundMusic from './components/BackgroundMusic';
import desktopBg from './assets/bg.png';
import mobileBg from './assets/dbg.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// 0G ZeroDash decentralized backend
const ZG_BACKEND = 'https://zerog-zerodash.onrender.com';

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

// Trust score label → display config
const TRUST_CONFIG = {
  PLATINUM:   { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: '#22d3ee', icon: '💎' },
  GOLD:       { color: '#ffd700', bg: 'rgba(255,215,0,0.12)',  border: '#ffd700', icon: '🥇' },
  SILVER:     { color: '#d1d5db', bg: 'rgba(209,213,219,0.12)', border: '#9ca3af', icon: '🥈' },
  BRONZE:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: '#f97316', icon: '🥉' },
  UNVERIFIED: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: '#4b5563', icon: '⬜' },
};

const ACTIVITY_LABELS = {
  SAVE_STORED:        { label: 'Save Stored',         color: '#3b82f6' },
  SAVE_ANCHORED:      { label: 'Save Anchored',        color: '#8b5cf6' },
  DA_FINALIZED:       { label: 'DA Finalized',         color: '#10b981' },
  DA_FAILED:          { label: 'DA Failed',            color: '#ef4444' },
  COMPUTE_VALIDATED:  { label: 'Compute Verified',     color: '#22d3ee' },
  COMPUTE_REJECTED:   { label: 'Compute Rejected',     color: '#f59e0b' },
};

function ServicePill({ label, status }) {
  const ok = status === 'ok' || status === 'healthy' || status === 'active' || status === 'connected';
  const color = ok ? '#10b981' : '#f59e0b';
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-pixel"
      style={{ background: `${color}18`, border: `1px solid ${color}`, color }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </div>
  );
}

function ZGNetworkCard({ network }) {
  if (!network) {
    return (
      <div className="w-full rounded-xl p-3" style={{ background: 'rgba(10,22,40,0.7)', border: '2px solid #1e3a5f' }}>
        <p className="text-xs font-pixel text-gray-500 text-center">Loading 0G network...</p>
      </div>
    );
  }
  const s = network.services || {};
  const overallOk = network.overall === 'ok' || network.overall === 'healthy';
  return (
    <div className="w-full rounded-xl p-3" style={{ background: 'rgba(10,22,40,0.7)', border: `2px solid ${overallOk ? '#10b981' : '#f59e0b'}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-pixel font-bold text-white">0G NETWORK</span>
        <span className="text-xs font-pixel" style={{ color: overallOk ? '#10b981' : '#f59e0b' }}>
          {overallOk ? '● LIVE' : '● DEGRADED'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {s.storage  && <ServicePill label="Storage"  status={s.storage.status} />}
        {s.chain    && <ServicePill label="Chain"    status={s.chain.status}   />}
        {s.da       && <ServicePill label="DA"       status={s.da.status}      />}
        {s.compute  && <ServicePill label="Compute"  status={s.compute.status} />}
      </div>
      {s.chain?.blockNumber && (
        <p className="text-xs font-pixel text-gray-500 mt-1">Block #{s.chain.blockNumber.toLocaleString()}</p>
      )}
    </div>
  );
}

function ZGPlayerCard({ dashboard }) {
  if (!dashboard) return null;

  const trust = dashboard.trustScore || {};
  const cfg = TRUST_CONFIG[trust.label] || TRUST_CONFIG.UNVERIFIED;
  const latestSave = dashboard.latestSave;
  const activity = (dashboard.recentActivity || []).slice(0, 4);

  return (
    <div className="w-full rounded-xl p-3 flex flex-col gap-3" style={{ background: 'rgba(10,22,40,0.7)', border: '2px solid #1e3a5f' }}>
      {/* Trust Score */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-pixel font-bold text-white">TRUST SCORE</span>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-pixel font-bold"
          style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.color }}
        >
          {cfg.icon} {trust.label || 'UNVERIFIED'} · {trust.score ?? 0}/100
        </div>
      </div>

      {/* Latest Save */}
      {latestSave?.rootHash && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 10px' }}>
          <p className="text-xs font-pixel text-gray-400 mb-1">LATEST SAVE</p>
          <p className="text-xs font-mono text-gray-300 break-all leading-tight">
            {latestSave.rootHash.slice(0, 18)}…{latestSave.rootHash.slice(-8)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {latestSave.pipeline?.finalized?.done && (
              <span className="text-xs font-pixel" style={{ color: '#10b981' }}>✓ Finalized</span>
            )}
            {latestSave.pipeline?.validated?.verdict === 'VALID' && (
              <span className="text-xs font-pixel" style={{ color: '#22d3ee' }}>✓ Verified</span>
            )}
            {latestSave.pipeline?.validated?.verdict === 'INVALID' && (
              <span className="text-xs font-pixel" style={{ color: '#ef4444' }}>✗ Invalid</span>
            )}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {activity.length > 0 && (
        <div>
          <p className="text-xs font-pixel text-gray-400 mb-1">RECENT ACTIVITY</p>
          <div className="flex flex-col gap-1">
            {activity.map((ev, i) => {
              const cfg = ACTIVITY_LABELS[ev.type] || { label: ev.type, color: '#6b7280' };
              const ts = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-pixel" style={{ color: cfg.color }}>· {cfg.label}</span>
                  {ts && <span className="text-xs font-pixel text-gray-600">{ts}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// WRAP GameRoot CONTENT IN A NEW COMPONENT
function GameRootContent({ privyEnabled }) {
  const { showToast } = useBlockchainToast();

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
  const { wallets: privyWallets } = useWallets();

  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const [privyWalletAddress, setPrivyWalletAddress] = useState(null);
  const [isJwtBootstrapping, setIsJwtBootstrapping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startGameError, setStartGameError] = useState(null);

  const [playerStats, setPlayerStats] = useState({ bestScore: 0, totalCoins: 0, rank: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // 0G data
  const [zgNetwork, setZgNetwork] = useState(null);
  const [zgDashboard, setZgDashboard] = useState(null);

  const fetch0GData = async (addr) => {
    // Always fetch public network status
    try {
      const res = await fetch(`${ZG_BACKEND}/0g/network`);
      if (res.ok) setZgNetwork(await res.json());
    } catch { /* non-fatal */ }

    // Fetch dashboard if we have a JWT
    try {
      const jwt = localStorage.getItem('zgJwt');
      if (!jwt || !addr) return;
      const res = await fetch(`${ZG_BACKEND}/0g/dashboard`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) setZgDashboard(await res.json());
    } catch { /* non-fatal */ }
  };

  const fetchPlayerStats = async () => {
    setStatsLoading(true);
    try {
      const storedWalletAddress = localStorage.getItem('walletAddress');
      if (!storedWalletAddress) { setStatsLoading(false); return; }

      const response = await fetch(`${BACKEND_URL}/player/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedWalletAddress}` },
      });
      if (!response.ok) throw new Error('Failed to fetch player stats');
      const data = await response.json();
      setPlayerStats({ bestScore: data.highScore || 0, totalCoins: data.coins || 0, rank: 0 });

      if (data.blockchain?.txHash) {
        showToast({ title: '🎮 Session Recorded', description: 'Your game session was tracked on blockchain', txHash: data.blockchain.txHash, duration: 5000 });
      }
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setPlayerStats({ bestScore: 0, totalCoins: 0, rank: 0 });
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
        setPlayerStats(prev => ({ ...prev, rank: playerIndex + 1 }));
      }
    } catch (err) {
      console.error('Error fetching player rank:', err);
    }
  };

  useEffect(() => {
    if (currentScreen === 'menu') {
      const addr = walletAddress || privyWalletAddress;
      fetchPlayerStats();
      fetchPlayerRank();
      fetch0GData(addr);
    }
  }, [currentScreen]);

  /**
   * Auto-enter menu when JWT + source=browser is provided in the URL
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get('jwt');
    const source = params.get('source');

    if (!jwt || source !== 'browser') {
      return;
    }

    localStorage.setItem('source', 'browser');

    let cancelled = false;

    const bootstrapFromJwt = async () => {
      setIsJwtBootstrapping(true);
      try {
        const response = await fetch(`${BACKEND_URL}/player/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jwt, source }),
        });

        if (!response.ok) {
          throw new Error('JWT validation failed');
        }

        const data = await response.json();
        const wallet = data?.walletAddress;

        if (!wallet) {
          throw new Error('Missing wallet in profile response');
        }

        localStorage.setItem('walletAddress', wallet);

        if (!cancelled) {
          setPrivyWalletAddress(wallet);
          setCurrentScreen('menu');
        }
      } catch (err) {
        console.warn('JWT bootstrap failed:', err);
      } finally {
        if (!cancelled) {
          setIsJwtBootstrapping(false);
        }
      }
    };

    bootstrapFromJwt();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    disconnectWallet();
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('privySession');
    localStorage.removeItem('zgJwt');
    try {
      await privyLogout();
    } catch {}
    setPrivyWalletAddress(null);
    setCurrentScreen('splash');
    setShowLeaderboard(false);
    setStartGameError(null);
  };

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setTimeout(() => {
        setCurrentScreen('menu');
      }, 300);
    }
  };

  /**
   * SIWE-style JWT authentication with the 0G ZeroDash backend.
   * Caches the token in localStorage to avoid re-signing within the same session.
   */
  const doJwtAuth = async (addr) => {
    const normalised = addr.toLowerCase();

    // Use cached JWT if it belongs to this wallet and is not expiring within 5 min
    const cached = localStorage.getItem('zgJwt');
    if (cached) {
      try {
        const [, payloadB64] = cached.split('.');
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        if (
          payload?.walletAddress === normalised &&
          payload?.exp * 1000 > Date.now() + 5 * 60 * 1000
        ) {
          return cached;
        }
      } catch { /* malformed token — re-auth */ }
    }

    // Step 1: get nonce + exact message to sign
    const nonceRes = await fetch(`${ZG_BACKEND}/auth/nonce?wallet=${encodeURIComponent(normalised)}`);
    if (!nonceRes.ok) throw new Error(`Nonce request failed: ${nonceRes.status}`);
    const { message, nonce } = await nonceRes.json();

    // Hex-encode the message (required by personal_sign)
    const msgBytes = new TextEncoder().encode(message);
    const msgHex = '0x' + Array.from(msgBytes, b => b.toString(16).padStart(2, '0')).join('');

    // Step 2: sign with the appropriate wallet provider
    let signature;
    const privyWallet = privyWallets?.find(w => w.address.toLowerCase() === normalised);
    if (privyWallet) {
      const provider = await privyWallet.getEthereumProvider();
      signature = await provider.request({ method: 'personal_sign', params: [msgHex, normalised] });
    } else if (window.ethereum) {
      signature = await window.ethereum.request({ method: 'personal_sign', params: [msgHex, normalised] });
    } else {
      throw new Error('No wallet provider available for signing');
    }

    // Step 3: exchange signature for JWT
    const loginRes = await fetch(`${ZG_BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: normalised, signature, nonce }),
    });
    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => ({}));
      throw new Error(err.error || `Login failed: ${loginRes.status}`);
    }
    const { token } = await loginRes.json();
    localStorage.setItem('zgJwt', token);
    return token;
  };

  /**
   * Do JWT auth first (stores token in localStorage['zgJwt']),
   * then load the game inline via GameCanvas — same as before.
   * GameCanvas.jsx picks up zgJwt and sends it to Unity via SendMessage.
   */
  const handleStartGame = async () => {
    const addr = walletAddress || privyWalletAddress;
    if (!addr) return;

    setIsStartingGame(true);
    setStartGameError(null);

    try {
      await doJwtAuth(addr); // stores JWT in localStorage['zgJwt']
      setIsStartingGame(false);
      setCurrentScreen('game'); // original behavior — GameCanvas loads Unity inline
    } catch (err) {
      console.error('JWT auth failed:', err);
      setStartGameError(err.message || 'Authentication failed — please try again.');
      setIsStartingGame(false);
    }
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

      {currentScreen === 'splash' && isJwtBootstrapping && (
        <div className="fixed inset-0 flex items-center justify-center p-5">
          <div className="text-center fade-in">
            <div className="w-10 h-10 mx-auto mb-4 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-pixel text-zerion-blue-light">
              Signing you in...
            </p>
          </div>
        </div>
      )}

      {currentScreen === 'splash' && !isJwtBootstrapping && (
        <WalletConnect
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={walletError}
          onPrivyConnect={privyEnabled ? () => setShowPrivyLogin(true) : undefined}
        />
      )}

      {currentScreen === 'menu' && !showLeaderboard && (
        <div className="fixed inset-0 overflow-y-auto z-[100]">
          <div className="min-h-full flex items-center justify-center py-6 px-4">
            <div className="max-w-sm w-full flex flex-col items-center gap-4 fade-in">

              {/* Title */}
              <h2
                className="text-4xl md:text-5xl font-pixel text-zerion-yellow"
                style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.6)' }}
              >
                READY?
              </h2>

              {/* Primary actions */}
              <button
                onClick={handleStartGame}
                disabled={isStartingGame}
                className="pixel-button-primary w-full text-lg"
                style={{ opacity: isStartingGame ? 0.7 : 1 }}
              >
                {isStartingGame ? '🔐 Authenticating...' : '🎮 START GAME'}
              </button>

              {startGameError && (
                <p className="text-xs font-pixel text-red-400 text-center px-2">
                  ⚠️ {startGameError}
                </p>
              )}

              <button onClick={handleOpenLeaderboard} className="pixel-button-secondary w-full">
                🏆 LEADERBOARD
              </button>

              {/* Player Stats */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { label: 'BEST',  value: playerStats.bestScore  > 0 ? playerStats.bestScore.toLocaleString()  : '0' },
                  { label: 'COINS', value: playerStats.totalCoins > 0 ? playerStats.totalCoins.toLocaleString() : '0' },
                  { label: 'RANK',  value: playerStats.rank > 0 ? `#${playerStats.rank}` : '-' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zerion-blue-dark/60 border-2 border-zerion-blue rounded-lg p-3 text-center">
                    <p className="text-xs font-pixel text-zerion-blue-light mb-1">{label}</p>
                    {statsLoading
                      ? <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                      : <p className="text-lg font-pixel text-zerion-yellow font-bold">{value}</p>
                    }
                  </div>
                ))}
              </div>

              {!statsLoading && (
                <button
                  onClick={() => { fetchPlayerStats(); fetchPlayerRank(); fetch0GData(walletAddress || privyWalletAddress); }}
                  className="text-xs font-pixel text-zerion-blue-light hover:text-zerion-yellow transition-colors"
                >
                  🔄 Refresh
                </button>
              )}

              {/* 0G Network status */}
              <ZGNetworkCard network={zgNetwork} />

              {/* 0G Player panel — only shown when dashboard data available */}
              {zgDashboard && <ZGPlayerCard dashboard={zgDashboard} />}

            </div>
          </div>
        </div>
      )}

      {currentScreen === 'game' && (
        <>
          <RealTimeLeaderboardSidebar isVisible={currentScreen === 'game'} currentUserAddress={truncatedAddress} />
          <GameCanvas walletAddress={walletAddress || privyWalletAddress} isVisible={currentScreen === 'game'} onBack={handleBackToMenu} />
          <UserProfileSidebar isVisible={currentScreen === 'game'} walletAddress={walletAddress} />
        </>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={handleCloseLeaderboard} />

      {import.meta.env.DEV && (
        <div className="fixed bottom-2 left-2 text-xs opacity-50 font-mono bg-black/50 p-2 rounded z-[9999]">
          <div>Screen: {currentScreen}</div>
          <div>Wallet: {isConnected ? '✅' : '❌'} {truncatedAddress || 'Not connected'}</div>
          <div>Stats: Best={playerStats.bestScore} Coins={playerStats.totalCoins} Rank={playerStats.rank || '-'}</div>
          <div>0G Net: {zgNetwork ? zgNetwork.overall : 'none'} | Dashboard: {zgDashboard ? '✅' : 'none'}</div>
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

