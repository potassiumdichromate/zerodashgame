import React, { useEffect } from 'react';

// Dummy leaderboard data
const LEADERBOARD_DATA = [
  { rank: 1, player: '0x7a9f...3c2d', score: 152300 },
  { rank: 2, player: '0x4b2e...8f1a', score: 143750 },
  { rank: 3, player: '0x9c5d...2b4e', score: 138200 },
  { rank: 4, player: '0x3e8a...7d9f', score: 127650 },
  { rank: 5, player: '0x6d1f...4a8c', score: 119800 },
  { rank: 6, player: '0x2a7b...9e3f', score: 112450 },
  { rank: 7, player: '0x8f4c...1d6b', score: 108900 },
  { rank: 8, player: '0x5c9e...6a2d', score: 102350 },
  { rank: 9, player: '0x1d3a...8f7c', score: 98700 },
  { rank: 10, player: '0xa6f2...3b9e', score: 94150 },
];

/**
 * Leaderboard Component
 * Modal overlay displaying top player scores
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Callback to close modal
 */
export default function Leaderboard({ isOpen, onClose }) {
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

        {/* Leaderboard List */}
        <ul className="mb-8 space-y-3">
          {LEADERBOARD_DATA.map((entry) => (
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
              <span className="flex-1 text-zerion-light text-xs md:text-sm">
                {entry.player}
              </span>

              {/* Score */}
              <span className="text-zerion-yellow-glow font-bold text-sm md:text-base">
                {entry.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

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