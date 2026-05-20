import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://zerodashbackend.onrender.com';

/**
 * Truncate wallet address for display
 */
const truncateAddress = (address) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Leaderboard Component
 * Modal overlay displaying top player scores
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Callback to close modal
 */
export default function Leaderboard({ isOpen, onClose }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zdComment, setZdComment] = useState(null);
  const [zdAiLoading, setZdAiLoading] = useState(false);

  /**
   * Fetch leaderboard data from backend
   */
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/player/leaderboard?limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      // Transform backend data to component format with ranks
      const formattedData = data?.leaderboard.map((player, index) => ({
        rank: index + 1,
        player: truncateAddress(player?.walletAddress),
        fullAddress: player?.walletAddress,
        score: player?.highScore,
        saveBackedBy0g:
          typeof player?.trust?.saveBackedBy0g === 'boolean'
            ? player?.trust?.saveBackedBy0g
            : false,
        acVettedWithCompute: player?.trust?.antiCheatSource === '0g_compute',
      }));

      setLeaderboardData(formattedData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZdAiLine = async () => {
    const wallet = localStorage.getItem('walletAddress');
    if (!wallet) {
      setZdComment('Connect a wallet to get a personalized 0G leaderboard line.');
      return;
    }
    setZdAiLoading(true);
    setZdComment(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/player/leaderboard/ai-comment?wallet=${encodeURIComponent(wallet)}`
      );
      const data = await res.json().catch(() => ({}));
      if (data?.comment && typeof data.comment === 'string') {
        setZdComment(data.comment);
      } else {
        setZdComment(
          data?._meta?.reason === 'missing_api_key'
            ? 'Backend needs ZERO_G_API_KEY for this feature.'
            : 'No roast available right now — check back soon.'
        );
      }
    } catch {
      setZdComment('Could not reach leaderboard AI.');
    } finally {
      setZdAiLoading(false);
    }
  };

  /**
   * Fetch data when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      setZdComment(null);
      fetchLeaderboard();
      fetchZdAiLine();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-5
                  transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar
                    p-8 md:p-10 relative
                    transition-transform duration-300 
                    ${isOpen ? 'scale-100' : 'scale-80'}`}
        style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #1a2d4d 100%)',
          border: '6px solid #ffd700',
          boxShadow: `
            0 0 0 4px #f59e0b,
            0 0 40px rgba(255, 215, 0, 0.5),
            inset 0 0 60px rgba(0, 0, 0, 0.5)
          `,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zerion-yellow hover:text-white transition-colors p-1"
          title="Close Leaderboard"
        >
          <X size={28} />
        </button>

        {/* Title */}
        <h2
          className="text-2xl md:text-3xl font-pixel text-zerion-yellow text-center mb-8"
          style={{ textShadow: '3px 3px 0 rgba(0, 0, 0, 0.8)' }}
        >
          LEADERBOARD
        </h2>
        <p className="text-center text-[10px] md:text-xs font-pixel text-zerion-blue-light -mt-5 mb-8 opacity-90">
          Showing top 50 users
        </p>

        {(zdAiLoading || zdComment) && (
          <div className="mb-6 rounded border-3 border-purple-500/70 bg-purple-950/40 px-4 py-3">
            <p className="text-[10px] font-pixel uppercase text-purple-300/90 mb-1 tracking-wide">
              0G compute leaderboard line
            </p>
            {zdAiLoading ? (
              <p className="text-xs font-pixel text-white/80 animate-pulse">Summoning commentators…</p>
            ) : (
              <p className="text-sm font-pixel text-white/95 leading-relaxed">&ldquo;{zdComment}&rdquo;</p>
            )}
            <button
              type="button"
              onClick={fetchZdAiLine}
              disabled={zdAiLoading}
              className="mt-2 text-[10px] font-pixel text-purple-200 hover:text-white underline disabled:opacity-40"
            >
              Refresh 0G take
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-pixel text-zerion-blue-light">Loading rankings...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-8 p-4 bg-red-500/20 border-3 border-red-500 rounded">
            <p className="text-sm font-pixel text-red-300 text-center">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="pixel-button-secondary w-full mt-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leaderboard List */}
        {!isLoading && !error && leaderboardData.length > 0 && (
          <ul className="mb-8 space-y-3">
            {leaderboardData.map((entry) => (
              <li
                key={entry.rank}
                className="flex items-center justify-between p-4 bg-black/40 
                           border-3 border-zerion-blue transition-all duration-200
                           hover:bg-zerion-blue/20 hover:translate-x-1"
                style={{ border: '3px solid #2563eb' }}
              >
                {/* Rank */}
                <span className="text-zerion-yellow font-bold text-sm md:text-base mr-4">
                  #{entry.rank}
                </span>

                {/* Player Address */}
                <span 
                  className="flex-1 text-zerion-light text-xs md:text-sm"
                  title={entry.fullAddress}
                >
                  {entry.player}
                </span>

                <span className="flex items-center gap-2 shrink-0">
                  {entry.acVettedWithCompute && (
                    <span
                      className="text-[9px] font-pixel text-cyan-300"
                      title="Suspicious jump was double-checked with 0G Compute"
                    >
                      AC·0g
                    </span>
                  )}
                  {entry.saveBackedBy0g && (
                    <span
                      className="inline-flex items-center rounded border border-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-pixel uppercase tracking-wide text-emerald-300"
                      title="Last profile snapshot routed through 0G DA"
                    >
                      0g
                    </span>
                  )}
                  <span className="text-zerion-yellow-glow font-bold text-sm md:text-base">
                    {entry.score.toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty State */}
        {!isLoading && !error && leaderboardData.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg font-pixel text-zerion-blue-light mb-4">
              No players yet
            </p>
            <p className="text-sm text-zerion-light opacity-60">
              Be the first to set a high score!
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="pixel-button-secondary w-full"
        >
          Close
        </button>

        {/* Instructions */}
        <p className="text-center text-xs opacity-60 mt-4">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  );
}
