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
import LandingPage from './components/LandingPage';
import { deserializePlayerBinaryResponse } from './lib/zerogBinarySave';
import { Gamepad2, Trophy } from 'lucide-react';

import desktopBg from './assets/bg.png';

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
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
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

function extractStatsFromBinarySave(saveData) {
  if (!saveData || typeof saveData !== 'object') {
    return null;
  }

  const coins = Number(saveData.coins ?? saveData.primaryValue);
  const bestScore = Number(saveData.highScore ?? saveData.bestScore ?? saveData.secondaryValue);

  if (!Number.isFinite(coins) && !Number.isFinite(bestScore)) {
    return null;
  }

  return {
    totalCoins: Number.isFinite(coins) ? coins : 0,
    bestScore: Number.isFinite(bestScore) ? bestScore : 0,
  };
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
    <div className="rounded-2xl overflow-hidden max-h-[75vh] overflow-y-auto custom-scrollbar" style={PANEL}>
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
function ZGPlayerPanel({ dashboard, loadedSave, loadError, isLoading }) {
  const PANEL = { background: 'rgba(5,15,30,0.85)', border: '2px solid #0f2744', backdropFilter: 'blur(12px)' };

  if (!dashboard && !loadedSave && !loadError && isLoading) return (
    <div className="rounded-2xl p-4" style={PANEL}>
      <p className="text-xs font-pixel text-gray-600 text-center">Loading your 0G data…</p>
    </div>
  );

  if (!dashboard && !loadedSave && !loadError) return (
    <div className="rounded-2xl p-4" style={PANEL}>
      <p className="text-xs font-pixel text-gray-600 text-center">No 0G save data found yet.</p>
    </div>
  );

  const trust = dashboard?.trustScore || {};
  const cfg   = TRUST_CONFIG[trust.label] || TRUST_CONFIG.UNVERIFIED;
  const bd    = trust.breakdown || {};
  const sum   = dashboard?.summary || {};
  const ls    = dashboard?.latestSave;
  const pipe  = ls?.pipeline || {};
  const acts  = (dashboard?.recentActivity || []).slice(0, 4);
  const saveData = loadedSave?.data && typeof loadedSave.data === 'object' ? loadedSave.data : null;
  const saveMeta = loadedSave?.meta || {};
  const saveCurrentCharacter = Array.isArray(saveData?.characters?.unlocked)
    ? saveData.characters.unlocked[saveData?.characters?.currentIndex || 0]
    : null;
  const saveRecordedAt = saveData?.recordedAt
    ? new Date(saveData.recordedAt).toLocaleString()
    : '—';

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar" style={PANEL}>

      {/* ── Trust Score ── */}
      {dashboard && (
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
      )}

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

      {/* ── Binary Load ── */}
      {(loadedSave || loadError) && (
        <div className="px-4 py-3" style={{ borderBottom: acts.length > 0 ? '1px solid #0f2744' : 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel font-bold text-white" style={{ fontSize: 11 }}>LOAD /BINARY</span>
            <span
              className="font-pixel font-bold px-2 py-0.5 rounded-full"
              style={{
                fontSize: 9,
                background: loadError ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.12)',
                border: `1px solid ${loadError ? '#ef4444' : '#22d3ee'}`,
                color: loadError ? '#fca5a5' : '#22d3ee',
              }}
            >
              {loadError ? 'ERROR' : loadedSave?.format?.toUpperCase() || 'READY'}
            </span>
          </div>

          {loadError ? (
            <p className="font-pixel" style={{ fontSize: 10, color: '#fca5a5', lineHeight: 1.5 }}>{loadError}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1 mb-2.5">
                {[
                  { l: 'BEST', v: saveData?.highScore ?? '—' },
                  { l: 'COINS', v: saveData?.coins ?? '—' },
                  { l: 'SAVE', v: saveMeta.saveIndex ?? '—' },
                  { l: 'BYTES', v: saveMeta.byteLength ?? 0 },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center rounded-lg py-1.5" style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <p className="font-pixel font-bold text-white truncate px-1" style={{ fontSize: 12 }}>{v}</p>
                    <p className="font-pixel text-gray-600" style={{ fontSize: 8 }}>{l}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                  <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>PLAYER</span>
                  <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{saveData?.playerName || saveData?.walletAddress || '—'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                  <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>RUNNER</span>
                  <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{saveCurrentCharacter || '—'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                  <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>AT</span>
                  <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{saveRecordedAt}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                  <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>DA</span>
                  <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{saveMeta.daStatus || '—'}</span>
                </div>
                {saveMeta.rootHash && (
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                    <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>ROOT</span>
                    <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{hx(saveMeta.rootHash, 16, 8)}</span>
                  </div>
                )}
                {saveMeta.checksumSha256 && (
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f' }}>
                    <span className="font-pixel text-gray-600 flex-shrink-0" style={{ fontSize: 9 }}>SHA256</span>
                    <span className="font-mono text-gray-300 truncate" style={{ fontSize: 10 }}>{hx(saveMeta.checksumSha256, 16, 8)}</span>
                  </div>
                )}
                {!loadedSave?.ok && (
                  <div className="rounded-lg px-2 py-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)' }}>
                    <p className="font-pixel text-yellow-300" style={{ fontSize: 9, lineHeight: 1.5 }}>
                      Binary payload loaded, but it did not deserialize into JSON. Hex preview: {saveMeta.hexPreview || '—'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
        className="w-full rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-300"
        style={{
          background: hasNFT ? 'rgba(5, 40, 20, 0.85)' : 'rgba(40, 20, 5, 0.85)',
          border: `3px solid ${hasNFT ? '#22c55e' : '#f97316'}`,
          boxShadow: hasNFT 
            ? '0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 10px rgba(34, 197, 94, 0.1)' 
            : '0 0 20px rgba(249, 115, 22, 0.3), inset 0 0 10px rgba(249, 115, 22, 0.1)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{hasNFT ? '🎫' : '🔒'}</span>
          <div>
            <p className="text-[11px] font-pixel font-bold mb-1" style={{ color: hasNFT ? '#4ade80' : '#fb923c' }}>
              ZERO DASH PASS
            </p>
            <p className="text-[9px] font-pixel text-white/90 leading-tight">
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
  const { showToast, clearToasts } = useBlockchainToast();

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

  const [playerStats, setPlayerStats] = useState({ bestScore: 0, totalCoins: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // 0G data
  const [zgNetwork, setZgNetwork] = useState(null);
  const [zgDashboard, setZgDashboard] = useState(null);
  const [zgLoadedSave, setZgLoadedSave] = useState(null);
  const [zgLoadedSaveError, setZgLoadedSaveError] = useState(null);
  const [zgDataLoading, setZgDataLoading] = useState(false);

  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetch0GData = async (addr) => {
    setZgDataLoading(true);
    setZgLoadedSaveError(null);

    // Always fetch public network status
    try {
      const res = await fetch(`${ZG_BACKEND}/0g/network`);
      if (res.ok) setZgNetwork(await res.json());
    } catch { /* non-fatal */ }

    try {
      if (!addr) {
        setZgDashboard(null);
        setZgLoadedSave(null);
        return;
      }

      let jwt = localStorage.getItem('zgJwt');
      if (!jwt) {
        jwt = await doJwtAuth(addr);
      }

      const headers = { Authorization: `Bearer ${jwt}` };
      const [dashboardRes, binaryRes] = await Promise.all([
        fetch(`${ZG_BACKEND}/0g/dashboard`, { headers }),
        fetch(`${ZG_BACKEND}/player/load/binary`, {
          headers: {
            ...headers,
            Accept: 'application/octet-stream,application/json;q=0.9,*/*;q=0.8',
          },
        }),
      ]);

      if (dashboardRes.ok) {
        setZgDashboard(await dashboardRes.json());
      } else {
        setZgDashboard(null);
      }

      if (binaryRes.ok) {
        const decodedSave = await deserializePlayerBinaryResponse(binaryRes);
        setZgLoadedSave(decodedSave);
        window.zeroDashBinarySave = decodedSave;

        const binaryStats = extractStatsFromBinarySave(decodedSave.data);
        if (binaryStats) {
          setPlayerStats(binaryStats);
        }

        console.group('[ZeroDash] /player/load/binary');
        console.log('decodedSave', decodedSave);
        console.log('meta', decodedSave.meta);
        console.log('format', decodedSave.format);
        console.log('parsedData', decodedSave.data);
        console.log('textPreview', decodedSave.textPreview);
        console.log('rawBase64', decodedSave.rawBase64);
        console.groupEnd();

        if (decodedSave.data) {
          localStorage.setItem('zgLoadedSaveJson', JSON.stringify(decodedSave.data));
        } else {
          localStorage.removeItem('zgLoadedSaveJson');
        }

        if (!decodedSave.ok) {
          setZgLoadedSaveError('Binary save loaded, but the payload could not be deserialized into JSON.');
        }
      } else if (binaryRes.status === 404 || binaryRes.status === 204) {
        setZgLoadedSave(null);
        localStorage.removeItem('zgLoadedSaveJson');
        console.warn('[ZeroDash] /player/load/binary returned no save payload', {
          status: binaryRes.status,
        });
      } else {
        let message = `Binary load failed (${binaryRes.status})`;
        try {
          const body = await binaryRes.json();
          message = body?.detail || body?.message || body?.error || message;
          console.warn('[ZeroDash] /player/load/binary failed', {
            status: binaryRes.status,
            body,
          });
        } catch {
          /* ignore parse errors */
          console.warn('[ZeroDash] /player/load/binary failed', {
            status: binaryRes.status,
          });
        }
        setZgLoadedSave(null);
        setZgLoadedSaveError(message);
      }
    } catch (err) {
      console.warn('0G load failed:', err);
      setZgDashboard(null);
      setZgLoadedSave(null);
      setZgLoadedSaveError(err?.message || 'Could not load your 0G save.');
    } finally {
      setZgDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentScreen === 'menu') {
      const addr =
        walletAddress ||
        privyWalletAddress ||
        localStorage.getItem('walletAddress');

      fetchPlayerStats();
      fetch0GData(addr);
    }
  }, [currentScreen, walletAddress, privyWalletAddress]);

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
      const binaryStats = extractStatsFromBinarySave(window.zeroDashBinarySave?.data);
      setPlayerStats(
        binaryStats || {
          bestScore: data.highScore || 0,
          totalCoins: data.coins || 0,
        }
      );

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
      setPlayerStats({ bestScore: 0, totalCoins: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

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
    localStorage.removeItem('zgLoadedSaveJson');
    delete window.zeroDashBinarySave;
    try {
      await privyLogout();
    } catch {}
    setPrivyWalletAddress(null);
    setCurrentScreen('splash');
    setStartGameError(null);
    setZgDashboard(null);
    setZgLoadedSave(null);
    setZgLoadedSaveError(null);
    clearToasts();
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
  };

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className={`relative w-full ${currentScreen === 'game' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'}`}>
      <HomeBackground />
      {currentScreen === 'menu' && (
        <Particles />
      )}
      <BackgroundMusic isPlaying={currentScreen !== 'game'} />


      {/* Removed redundant fixed logout button - handled by LandingPage header */}

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

      {(!isJwtBootstrapping && (currentScreen === 'splash' || currentScreen === 'menu')) && (
        <LandingPage 
          onPlayNow={() => setShowPrivyLogin(true)} 
          onLogout={handleLogout}
          isLoggedIn={currentScreen === 'menu'}
          heroOverride={currentScreen === 'menu' && !showLeaderboard ? (
            <div className="relative min-h-[90vh] w-full flex items-center justify-center">
              {/* ── LEFT PANEL — 0G Network + NFT Pass ── */}
              <div className="hidden lg:flex absolute left-5 top-1/2 -translate-y-1/2 z-[100] flex-col gap-3" style={{ width: 270 }}>
                <ZGNetworkPanel network={zgNetwork} />
                <NFTPassInline walletAddress={walletAddress || privyWalletAddress} />
              </div>

              {/* ── CENTER — Main actions ── */}
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
                  className="btn-gold w-full flex justify-center items-center gap-2"
                  style={{ opacity: isStartingGame ? 0.7 : 1 }}
                >
                  {isStartingGame ? '🔐 Authenticating...' : (
                    <>
                      <Gamepad2 size={20} />
                      START GAME
                    </>
                  )}
                </button>

                {startGameError && (
                  <p className="text-xs font-pixel text-red-400 text-center">⚠️ {startGameError}</p>
                )}

                <button 
                  onClick={handleOpenLeaderboard} 
                  className="btn-outline w-full flex justify-center items-center gap-2"
                >
                  <Trophy size={20} className="text-gold" />
                  LEADERBOARD
                </button>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { label: 'BEST',  value: playerStats.bestScore  > 0 ? playerStats.bestScore.toLocaleString()  : '0' },
                    { label: 'COINS', value: playerStats.totalCoins > 0 ? playerStats.totalCoins.toLocaleString() : '0' },
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
                  onClick={() => { fetchPlayerStats(); fetch0GData(walletAddress || privyWalletAddress); }}
                  className="font-pixel text-zerion-blue-light hover:text-zerion-yellow transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zerion-blue-dark/50 border border-zerion-blue-light/30 hover:border-zerion-yellow/50 mt-2"
                  style={{ fontSize: 10 }}
                >
                  🔄 Refresh Stats
                </button>

                {/* Mobile-only: NFT Pass */}
                <div className="lg:hidden w-full">
                  <NFTPassInline walletAddress={walletAddress || privyWalletAddress} />
                </div>
              </div>

              {/* ── RIGHT PANEL — 0G Player data ── */}
              <div className="hidden lg:block absolute right-5 top-1/2 -translate-y-1/2 z-[100]" style={{ width: 280 }}>
                <ZGPlayerPanel
                  dashboard={zgDashboard}
                  loadedSave={zgLoadedSave}
                  loadError={zgLoadedSaveError}
                  isLoading={zgDataLoading}
                />
              </div>
            </div>
          ) : null}
        />
      )}


      {currentScreen === 'game' && (
        <>
          <RealTimeLeaderboardSidebar isVisible={currentScreen === 'game'} currentUserAddress={truncatedAddress} />
          <GameCanvas walletAddress={walletAddress || privyWalletAddress} isVisible={currentScreen === 'game'} onBack={handleBackToMenu} />
          <UserProfileSidebar isVisible={currentScreen === 'game'} walletAddress={walletAddress} />
        </>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={handleCloseLeaderboard} />

      {import.meta.env.DEV && currentScreen !== 'splash' && !isMobileViewport && (
        <div className="fixed bottom-2 left-2 text-[10px] sm:text-xs font-mono bg-black/85 border border-white/10 p-3 rounded-lg z-[9999] shadow-2xl backdrop-blur-md text-white/80 hidden sm:block">
          <div>Screen: {currentScreen}</div>
          <div 
            className="cursor-pointer hover:text-white transition-colors flex items-center gap-2"
            title="Click to copy full address"
            onClick={() => {
              const addr = walletAddress || privyWalletAddress || localStorage.getItem('walletAddress');
              if (addr) {
                navigator.clipboard.writeText(addr);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            Wallet: {isConnected ? '✅' : '❌'} {truncatedAddress || 'Not connected'}
            {copied && <span className="text-green-400 text-[9px] font-bold animate-pulse">COPIED!</span>}
          </div>
          <div>Stats: Best={playerStats.bestScore} Coins={playerStats.totalCoins}</div>
          <div>0G Net: {zgNetwork ? zgNetwork.overall : 'none'} | Dashboard: {zgDashboard ? '✅' : 'none'} | Binary: {zgLoadedSave ? zgLoadedSave.format : (zgLoadedSaveError ? 'error' : 'none')}</div>
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
