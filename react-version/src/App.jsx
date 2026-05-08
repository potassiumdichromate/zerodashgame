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

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// 0G ZeroDash decentralized backend
const ZG_BACKEND = 'https://zerog-zerodash.onrender.com';
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://zerodashbackend.onrender.com';

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

const TRUST_CONFIG = {
  PLATINUM:   { color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  border: '#22d3ee', glow: '0 0 20px rgba(34,211,238,0.35)',  icon: '💎', num: '#22d3ee' },
  GOLD:       { color: '#ffd700', bg: 'rgba(255,215,0,0.12)',   border: '#ffd700', glow: '0 0 20px rgba(255,215,0,0.35)',   icon: '🥇', num: '#ffd700' },
  SILVER:     { color: '#d1d5db', bg: 'rgba(209,213,219,0.10)', border: '#9ca3af', glow: '0 0 16px rgba(209,213,219,0.2)', icon: '🥈', num: '#d1d5db' },
  BRONZE:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: '#f97316', glow: '0 0 16px rgba(249,115,22,0.3)',  icon: '🥉', num: '#f97316' },
  UNVERIFIED: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: '#4b5563', glow: 'none',                           icon: '⬜', num: '#6b7280' },
};

const ACTIVITY_META = {
  SAVE_STORED:       { color: '#3b82f6', label: 'Stored',    dot: '🗄' },
  SAVE_ANCHORED:     { color: '#8b5cf6', label: 'Anchored',  dot: '⛓' },
  DA_FINALIZED:      { color: '#10b981', label: 'Finalized', dot: '✅' },
  DA_FAILED:         { color: '#ef4444', label: 'DA Failed', dot: '❌' },
  COMPUTE_VALIDATED: { color: '#22d3ee', label: 'Verified',  dot: '🛡' },
  COMPUTE_REJECTED:  { color: '#f59e0b', label: 'Flagged',   dot: '⚠' },
};

const SVC_COLOR = { online: '#10b981', configured: '#22d3ee', connecting: '#f59e0b', unreachable: '#ef4444', disabled: '#6b7280' };

function hx(h, a = 8, b = 6) { if (!h) return '—'; return `${h.slice(0, a)}…${h.slice(-b)}`; }

function PipelineDot({ done, label, explorerUrl, pending }) {
  const color = done ? '#10b981' : pending ? '#f59e0b' : '#1f2937';
  const el = (
    <span title={label} style={{
      display: 'inline-block', width: 11, height: 11, borderRadius: '50%',
      background: color, border: `2px solid ${done ? color : '#374151'}`,
      boxShadow: done ? `0 0 8px ${color}` : 'none', flexShrink: 0, cursor: explorerUrl && done ? 'pointer' : 'default',
    }} />
  );
  return explorerUrl && done
    ? <a href={explorerUrl} target="_blank" rel="noopener noreferrer">{el}</a>
    : el;
}

/* ── LEFT PANEL — 0G Network ─────────────────────────────────────────── */
function ZGNetworkPanel({ network }) {
  const PANEL = { background: 'rgba(5,15,30,0.85)', border: '2px solid #0f2744', backdropFilter: 'blur(12px)' };

  if (!network) return (
    <div className="rounded-2xl p-4" style={PANEL}>
      <p className="text-xs font-pixel text-gray-600 text-center">Checking 0G network…</p>
    </div>
  );

  const s = network.services || {};
  const ok = network.overall === 'healthy' || network.overall === 'ok';
  const svcs = [
    { key: 'storage', label: 'Storage',  svc: s.storage },
    { key: 'chain',   label: 'Chain',    svc: s.chain   },
    { key: 'da',      label: 'DA Layer', svc: s.da      },
    { key: 'compute', label: 'Compute',  svc: s.compute },
  ].filter(x => x.svc);

  return (
    <div className="rounded-2xl overflow-hidden" style={PANEL}>
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #0f2744', background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-pixel font-bold text-white">0G NETWORK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#10b981' : '#f59e0b', boxShadow: `0 0 8px ${ok ? '#10b981' : '#f59e0b'}`, display: 'inline-block' }} />
          <span className="font-pixel font-bold" style={{ fontSize: 10, color: ok ? '#10b981' : '#f59e0b' }}>{ok ? 'LIVE' : 'ISSUES'}</span>
        </div>
      </div>

      {/* service rows */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {svcs.map(({ key, label, svc }) => {
          const c = SVC_COLOR[svc.status] || '#6b7280';
          const row = (
            <div className="flex items-center justify-between px-2.5 py-2 rounded-xl" style={{ background: `${c}0d`, border: `1px solid ${c}30` }}>
              <div className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, display: 'inline-block' }} />
                <span className="font-pixel font-bold" style={{ fontSize: 11, color: c }}>{label}</span>
              </div>
              {svc.latencyMs != null && <span className="font-mono" style={{ fontSize: 10, color: '#4b5563' }}>{svc.latencyMs}ms</span>}
            </div>
          );
          return key === 'chain' && svc.explorerUrl
            ? <a key={key} href={svc.explorerUrl} target="_blank" rel="noopener noreferrer" className="no-underline block">{row}</a>
            : <div key={key}>{row}</div>;
        })}
      </div>

      {/* block number */}
      {s.chain?.blockNumber && (
        <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid #0f2744' }}>
          <span className="font-pixel text-gray-600" style={{ fontSize: 10 }}>BLOCK</span>
          {s.chain.explorerUrl
            ? <a href={s.chain.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-bold" style={{ fontSize: 11, color: '#22d3ee' }}>#{s.chain.blockNumber.toLocaleString()} ↗</a>
            : <span className="font-mono font-bold text-gray-400" style={{ fontSize: 11 }}>#{s.chain.blockNumber.toLocaleString()}</span>
          }
        </div>
      )}
    </div>
  );
}

/* ── RIGHT PANEL — Player 0G data ────────────────────────────────────── */
function ZGPlayerPanel({ dashboard }) {
  const PANEL = { background: 'rgba(5,15,30,0.85)', border: '2px solid #0f2744', backdropFilter: 'blur(12px)' };

  if (!dashboard) return (
    <div className="rounded-2xl p-4" style={PANEL}>
      <p className="text-xs font-pixel text-gray-600 text-center">Loading your 0G data…</p>
    </div>
  );

  const trust = dashboard.trustScore || {};
  const cfg   = TRUST_CONFIG[trust.label] || TRUST_CONFIG.UNVERIFIED;
  const bd    = trust.breakdown || {};
  const sum   = dashboard.summary || {};
  const ls    = dashboard.latestSave;
  const pipe  = ls?.pipeline || {};
  const acts  = (dashboard.recentActivity || []).slice(0, 4);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={PANEL}>

      {/* ── Trust Score ── */}
      <div className="px-4 py-3" style={{ background: cfg.bg, borderBottom: '1px solid #0f2744', boxShadow: cfg.glow }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-pixel font-bold text-white">TRUST SCORE</span>
          <span className="font-pixel font-bold px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: `${cfg.border}22`, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            {cfg.icon} {trust.label}
          </span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="font-pixel font-bold" style={{ fontSize: 32, lineHeight: 1, color: cfg.num, textShadow: cfg.glow }}>{trust.score ?? 0}</span>
          <span className="font-pixel text-gray-600 mb-1" style={{ fontSize: 11 }}>/100</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { l: 'SAVES',     v: bd.totalSaves ?? sum.totalSaves ?? 0 },
            { l: 'ANCHORED',  v: bd.anchoredSaves ?? sum.anchoredSaves ?? 0 },
            { l: 'DA',        v: bd.finalizedSaves ?? sum.finalizedSaves ?? 0 },
            { l: 'TEE',       v: bd.computeValidated ?? 0 },
          ].map(({ l, v }) => (
            <div key={l} className="text-center rounded-lg py-1.5" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <p className="font-pixel font-bold text-white" style={{ fontSize: 14 }}>{v}</p>
              <p className="font-pixel text-gray-600" style={{ fontSize: 8 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Latest Save ── */}
      {ls && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #0f2744' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel font-bold text-white" style={{ fontSize: 11 }}>SAVE <span style={{ color: '#ffd700' }}>#{ls.saveIndex}</span></span>
            <span className="font-pixel text-gray-500" style={{ fontSize: 10 }}>{ls.fileSize}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {ls.rootHash && (
              <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>ROOT</span>
                <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{hx(ls.rootHash, 16, 8)}</span>
              </div>
            )}
            {pipe.stored?.txHash && (
              <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>TX</span>
                {pipe.stored.explorerUrl
                  ? <a href={pipe.stored.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono truncate font-bold" style={{ fontSize: 10, color: '#22d3ee' }}>{hx(pipe.stored.txHash)} ↗</a>
                  : <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{hx(pipe.stored.txHash)}</span>
                }
              </div>
            )}
            {pipe.anchored?.txHash && (
              <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>ANCHOR</span>
                {pipe.anchored.explorerUrl
                  ? <a href={pipe.anchored.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono truncate font-bold" style={{ fontSize: 10, color: '#8b5cf6' }}>{hx(pipe.anchored.txHash)} ↗</a>
                  : <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{hx(pipe.anchored.txHash)}</span>
                }
              </div>
            )}
          </div>

          {/* Pipeline track */}
          <div className="flex items-center gap-1 mt-2.5">
            {[
              { done: pipe.stored?.done,   label: 'Stored',   url: pipe.stored?.explorerUrl },
              { done: pipe.anchored?.done,  label: 'Anchored', url: pipe.anchored?.explorerUrl },
              { done: pipe.finalized?.done, label: 'DA Final', pending: pipe.finalized?.status === 'pending' },
              { done: pipe.validated?.done, label: `TEE ${pipe.validated?.verdict || ''}` },
            ].map((p, i) => (
              <React.Fragment key={i}>
                <PipelineDot {...p} />
                {i < 3 && <span style={{ flex: 1, height: 2, background: p.done ? '#10b98155' : '#1f2937', borderRadius: 2 }} />}
              </React.Fragment>
            ))}
            {pipe.validated?.verdict && (
              <span className="font-pixel font-bold ml-1" style={{ fontSize: 10, color: pipe.validated.verdict === 'CLEAN' ? '#22d3ee' : '#f59e0b' }}>
                {pipe.validated.verdict}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Activity Feed ── */}
      {acts.length > 0 && (
        <div className="px-4 py-3 flex flex-col gap-0" style={{ flex: 1, overflowY: 'auto' }}>
          <span className="font-pixel font-bold text-white mb-2" style={{ fontSize: 11 }}>ACTIVITY</span>
          <div className="flex flex-col gap-2">
            {acts.map((ev) => {
              const m  = ACTIVITY_META[ev.type] || { color: '#6b7280', dot: '·', label: ev.type };
              const ts = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={ev.id} className="rounded-xl px-3 py-2" style={{ background: `${m.color}0d`, border: `1px solid ${m.color}25` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 11 }}>{m.dot}</span>
                      <span className="font-pixel font-bold" style={{ fontSize: 11, color: m.color }}>{ev.title}</span>
                    </div>
                    <span className="font-pixel flex-shrink-0" style={{ fontSize: 9, color: '#4b5563' }}>{ts}</span>
                  </div>
                  {ev.description && (
                    <p className="font-pixel" style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>{ev.description}</p>
                  )}
                  {ev.explorerUrl && (
                    <a href={ev.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-pixel font-bold mt-0.5 inline-block" style={{ fontSize: 10, color: '#22d3ee', textDecoration: 'none' }}>
                      View on explorer ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NFTPassInline({ walletAddress }) {
  const [hasNFT, setHasNFT] = useState(null); // null = loading
  const [showMintModal, setShowMintModal] = useState(false);

  useEffect(() => {
    const check = async () => {
      setHasNFT(null);
      try {
        const addr = localStorage.getItem('walletAddress');
        if (!addr) { setHasNFT(false); return; }
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/player/profile`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${addr}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHasNFT(data.nftPass === true);
      } catch {
        setHasNFT(false);
      }
    };
    check();
  }, [walletAddress]);

  // Dynamically import NFTMintModal only when needed
  const [MintModal, setMintModal] = useState(null);
  useEffect(() => {
    import('./components/NFTMintModal').then(m => setMintModal(() => m.default));
  }, []);

  if (hasNFT === null) {
    return (
      <div className="w-full rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(10,22,40,0.7)', border: '2px solid #1e3a5f' }}>
        <div className="w-4 h-4 border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-xs font-pixel text-gray-400">Checking NFT Pass...</span>
      </div>
    );
  }

  return (
    <>
      {showMintModal && MintModal && (
        <MintModal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
          onMintSuccess={() => { setShowMintModal(false); setHasNFT(true); }}
        />
      )}
      <div
        className="w-full rounded-xl px-4 py-3 flex items-center justify-between"
        style={{
          background: hasNFT ? 'rgba(22,101,52,0.3)' : 'rgba(120,53,15,0.25)',
          border: `2px solid ${hasNFT ? '#22c55e' : '#f97316'}`,
          boxShadow: hasNFT ? '0 0 12px rgba(34,197,94,0.2)' : '0 0 12px rgba(249,115,22,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{hasNFT ? '🎫' : '🔒'}</span>
          <div>
            <p className="text-xs font-pixel font-bold" style={{ color: hasNFT ? '#22c55e' : '#f97316' }}>
              ZERO DASH PASS
            </p>
            <p className="text-xs font-pixel text-gray-400">
              {hasNFT ? 'Active — special levels & rewards unlocked' : 'Mint to unlock exclusive content'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasNFT
            ? <span className="text-xs font-pixel px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid #22c55e' }}>ACTIVE</span>
            : (
              <button
                onClick={() => setShowMintModal(true)}
                className="text-xs font-pixel px-3 py-1.5 rounded-lg font-bold"
                style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', color: '#000', border: 'none' }}
              >
                MINT
              </button>
            )
          }
        </div>
      </div>
    </>
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
        <>
          {/* ── LEFT PANEL — 0G Network + NFT Pass ── */}
          <div className="hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-[100] flex-col gap-3" style={{ width: 270 }}>
            <ZGNetworkPanel network={zgNetwork} />
            <NFTPassInline walletAddress={walletAddress || privyWalletAddress} />
          </div>

          {/* ── CENTER — Main actions ── */}
          <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="flex flex-col items-center gap-4 fade-in pointer-events-auto" style={{ width: 320 }}>
              <h2
                className="text-5xl font-pixel text-zerion-yellow"
                style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.9), 0 0 40px rgba(255,215,0,0.7)' }}
              >
                READY?
              </h2>

              <button
                onClick={handleStartGame}
                disabled={isStartingGame}
                className="pixel-button-primary w-full text-lg"
                style={{ opacity: isStartingGame ? 0.7 : 1 }}
              >
                {isStartingGame ? '🔐 Authenticating...' : '🎮 START GAME'}
              </button>

              {startGameError && (
                <p className="text-xs font-pixel text-red-400 text-center">⚠️ {startGameError}</p>
              )}

              <button onClick={handleOpenLeaderboard} className="pixel-button-secondary w-full">
                🏆 LEADERBOARD
              </button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { label: 'BEST',  value: playerStats.bestScore  > 0 ? playerStats.bestScore.toLocaleString()  : '0' },
                  { label: 'COINS', value: playerStats.totalCoins > 0 ? playerStats.totalCoins.toLocaleString() : '0' },
                  { label: 'RANK',  value: playerStats.rank > 0 ? `#${playerStats.rank}` : '—' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(5,15,30,0.8)', border: '2px solid #0f2744', backdropFilter: 'blur(8px)' }}
                  >
                    <p className="font-pixel text-gray-500 mb-1" style={{ fontSize: 10 }}>{label}</p>
                    {statsLoading
                      ? <div className="w-4 h-4 mx-auto border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                      : <p className="font-pixel font-bold text-zerion-yellow" style={{ fontSize: 20 }}>{value}</p>
                    }
                  </div>
                ))}
              </div>

              <button
                onClick={() => { fetchPlayerStats(); fetchPlayerRank(); fetch0GData(walletAddress || privyWalletAddress); }}
                className="font-pixel text-gray-600 hover:text-zerion-yellow transition-colors"
                style={{ fontSize: 10 }}
              >
                🔄 Refresh
              </button>

              {/* Mobile-only: NFT Pass */}
              <div className="lg:hidden w-full">
                <NFTPassInline walletAddress={walletAddress || privyWalletAddress} />
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL — 0G Player data ── */}
          <div className="hidden lg:block fixed right-5 top-1/2 -translate-y-1/2 z-[100]" style={{ width: 280 }}>
            {zgDashboard
              ? <ZGPlayerPanel dashboard={zgDashboard} />
              : (
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(5,15,30,0.85)', border: '2px solid #0f2744', backdropFilter: 'blur(12px)' }}>
                  <div className="w-8 h-8 mx-auto mb-3 border-2 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                  <p className="font-pixel text-gray-600" style={{ fontSize: 11 }}>Loading your 0G data…</p>
                </div>
              )
            }
          </div>
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

