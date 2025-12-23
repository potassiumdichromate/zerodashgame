import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';
const REFRESH_INTERVAL = 240000; // 4 minutes (240 seconds)

/**
 * Truncate wallet address for display
 */
const truncateAddress = (address) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * RealTimeLeaderboardSidebar Component
 * Displays live leaderboard during gameplay
 * Shows top 10 players with their scores
 * Updates every 4 minutes
 */
export default function RealTimeLeaderboardSidebar({ isVisible, currentUserAddress }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch leaderboard data from backend
   */
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/player/leaderboard?limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      // Transform backend data to component format
      const formattedData = data.map((player, index) => ({
        rank: index + 1,
        address: truncateAddress(player.walletAddress),
        fullAddress: player.walletAddress,
        score: player.highScore,
        isOnline: true, // You can add online status from backend later
      }));

      setLeaderboard(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial load and periodic refresh
   */
  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard();
      
      // Refresh every 4 minutes
      const interval = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  /**
   * Get rank color based on position
   */
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-600';
    return 'text-blue-300';
  };

  /**
   * Get rank icon
   */
  const getRankIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '•';
  };

  /**
   * Check if address matches current user
   */
  const isCurrentUser = (fullAddress) => {
    if (!currentUserAddress || !fullAddress) return false;
    
    // Handle truncated addresses
    if (currentUserAddress.includes('...')) {
      return truncateAddress(fullAddress) === currentUserAddress;
    }
    
    // Handle full addresses (case-insensitive)
    return fullAddress.toLowerCase() === currentUserAddress.toLowerCase();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 w-64 z-[400] hidden lg:block">
      <div
        className="bg-zerion-blue-dark/95 border-4 border-zerion-yellow rounded-lg overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark p-4 border-b-4 border-zerion-yellow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-pixel text-zerion-yellow font-bold">
              🏆 LIVE RANKINGS
            </h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-pixel">LIVE</span>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="custom-scrollbar overflow-y-auto" style={{ maxHeight: '500px' }}>
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-pixel text-zerion-blue-light">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-xs font-pixel text-red-400 mb-3">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="text-xs font-pixel text-zerion-yellow hover:text-zerion-yellow-glow"
              >
                Retry
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-pixel text-zerion-blue-light">
                No players yet
              </p>
            </div>
          ) : (
            <div className="p-2">
              {leaderboard.map((player) => {
                const isCurrent = isCurrentUser(player.fullAddress);
                
                return (
                  <div
                    key={player.rank}
                    className={`
                      mb-2 p-3 rounded border-2 transition-all duration-200
                      ${isCurrent
                        ? 'bg-zerion-yellow/20 border-zerion-yellow animate-pulse' 
                        : 'bg-zerion-blue-medium/50 border-zerion-blue hover:bg-zerion-blue-medium/70'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Rank & Icon */}
                      <div className="flex items-center gap-2 min-w-[50px]">
                        <span className="text-lg">{getRankIcon(player.rank)}</span>
                        <span className={`font-pixel text-sm font-bold ${getRankColor(player.rank)}`}>
                          #{player.rank}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p 
                            className="text-xs font-pixel text-zerion-light truncate"
                            title={player.fullAddress}
                          >
                            {isCurrent ? '👤 YOU' : player.address}
                          </p>
                          {player.isOnline && (
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-xs font-pixel text-zerion-yellow font-bold">
                          {player.score.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zerion-blue-dark/80 p-3 border-t-4 border-zerion-blue">
          <p className="text-xs font-pixel text-zerion-blue-light text-center">
            Updates every {REFRESH_INTERVAL / 1000 / 60} min
          </p>
        </div>
      </div>
    </div>
  );
}