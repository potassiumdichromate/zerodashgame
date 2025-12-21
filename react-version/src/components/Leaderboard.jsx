import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

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
      const formattedData = data.map((player, index) => ({
        rank: index + 1,
        player: truncateAddress(player.walletAddress),
        fullAddress: player.walletAddress,
        score: player.highScore,
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

  /**
   * Fetch data when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
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
        {/* Title */}
        <h2
          className="text-2xl md:text-3xl font-pixel text-zerion-yellow text-center mb-8"
          style={{ textShadow: '3px 3px 0 rgba(0, 0, 0, 0.8)' }}
        >
          LEADERBOARD
        </h2>

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

                {/* Score */}
                <span className="text-zerion-yellow-glow font-bold text-sm md:text-base">
                  {entry.score.toLocaleString()}
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