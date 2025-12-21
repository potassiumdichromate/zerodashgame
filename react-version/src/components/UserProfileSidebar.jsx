import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

/**
 * UserProfileSidebar Component
 * Displays current user's stats and progress during gameplay
 * Shows: Best Score, Total Coins, Characters, Daily Rewards, etc.
 */
export default function UserProfileSidebar({ isVisible, walletAddress }) {
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user profile stats from backend
   */
  const fetchUserStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get wallet address from localStorage
      const storedWalletAddress = localStorage.getItem('walletAddress');
      
      if (!storedWalletAddress) {
        throw new Error('No wallet address found');
      }

      const response = await fetch(`${BACKEND_URL}/player/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedWalletAddress}`, // Send wallet address as Bearer token
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      // Transform backend data to component format
      const transformedStats = {
        // Direct mappings from backend
        bestScore: data.highScore || 0,
        totalCoins: data.coins || 0,
        walletAddress: data.walletAddress,
        
        // Character data
        unlockedCharacters: data.characters?.unlocked?.length || 0,
        currentCharacter: data.characters?.unlocked?.[data.characters?.currentIndex] || 'HERO1',
        
        // Daily reward status
        nextRewardAt: data.dailyReward?.nextRewardAt,
        canClaimReward: data.dailyReward?.nextRewardAt 
          ? new Date(data.dailyReward.nextRewardAt) <= new Date()
          : false,
        
        // Account info
        accountAge: data.createdAt ? calculateAccountAge(data.createdAt) : '0d',
        lastActive: data.updatedAt ? formatLastActive(data.updatedAt) : 'Now',
        
        // Calculated/derived stats (you can add these to backend later)
        gamesPlayed: Math.floor(data.highScore / 100) || 1, // Rough estimate
        averageScore: Math.floor(data.highScore * 0.7) || 0, // Rough estimate
        
        // Placeholder for future backend fields
        level: calculateLevel(data.highScore),
        xp: data.coins % 1000, // Use coins as temp XP
        xpToNextLevel: 1000,
        rank: 0, // Will be calculated from leaderboard
        achievements: data.characters?.unlocked?.length || 0,
        streakDays: 0, // Add to backend later
      };

      setUserStats(transformedStats);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
      setUserStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate level based on high score
   */
  const calculateLevel = (highScore) => {
    if (!highScore) return 1;
    return Math.floor(highScore / 100) + 1;
  };

  /**
   * Calculate account age
   */
  const calculateAccountAge = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month';
    if (diffMonths < 12) return `${diffMonths} months`;
    
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 year' : `${diffYears} years`;
  };

  /**
   * Format last active time
   */
  const formatLastActive = (updatedAt) => {
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - updated) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Now';
    if (diffMinutes === 1) return '1m ago';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  /**
   * Format time until next reward
   */
  const getRewardTimeRemaining = () => {
    if (!userStats?.nextRewardAt) return null;
    
    const now = new Date();
    const nextReward = new Date(userStats.nextRewardAt);
    const diff = nextReward - now;
    
    if (diff <= 0) return 'Ready!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  /**
   * Initial load and auto-refresh
   */
  useEffect(() => {
    if (isVisible) {
      fetchUserStats();
      
      // Refresh every 30 seconds to update "last active" and reward timer
      const interval = setInterval(fetchUserStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  /**
   * Format wallet address
   */
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Calculate XP percentage
   */
  const xpPercentage = userStats 
    ? Math.round((userStats.xp / userStats.xpToNextLevel) * 100)
    : 0;

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 w-64 z-[400] hidden lg:block">
      <div
        className="bg-zerion-blue-dark/95 border-4 border-zerion-yellow rounded-lg overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark p-4 border-b-4 border-zerion-yellow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-zerion-yellow to-orange-500 rounded-lg flex items-center justify-center text-2xl border-2 border-zerion-yellow-dark">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-pixel text-zerion-blue-light">PLAYER</p>
              <p className="text-sm font-pixel text-zerion-yellow font-bold truncate">
                {truncateAddress(walletAddress)}
              </p>
              {userStats?.lastActive && (
                <p className="text-xs font-pixel text-zerion-blue-light opacity-60">
                  {userStats.lastActive}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Content */}
        <div className="custom-scrollbar overflow-y-auto" style={{ maxHeight: '500px' }}>
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-pixel text-zerion-blue-light">Loading stats...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-xs font-pixel text-red-400 mb-3">{error}</p>
              <button
                onClick={fetchUserStats}
                className="text-xs font-pixel text-zerion-yellow hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : userStats ? (
            <div className="p-4 space-y-4">
              {/* Level & XP */}
              <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-pixel text-zerion-blue-light">LEVEL</span>
                  <span className="text-lg font-pixel text-zerion-yellow font-bold">
                    {userStats.level}
                  </span>
                </div>
                <div className="relative h-3 bg-zerion-blue-dark rounded-full overflow-hidden border-2 border-zerion-blue">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-zerion-yellow transition-all duration-500"
                    style={{ width: `${xpPercentage}%` }}
                  />
                </div>
                <p className="text-xs font-pixel text-zerion-blue-light mt-1 text-center">
                  {userStats.xp} / {userStats.xpToNextLevel} XP
                </p>
              </div>

              {/* Daily Reward Status */}
              {userStats.nextRewardAt && (
                <div className={`border-2 rounded-lg p-3 ${
                  userStats.canClaimReward 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500 animate-pulse' 
                    : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{userStats.canClaimReward ? '🎁' : '⏰'}</span>
                    <span className="text-xs font-pixel text-zerion-blue-light">DAILY REWARD</span>
                  </div>
                  <p className="text-lg font-pixel text-white font-bold text-center">
                    {getRewardTimeRemaining()}
                  </p>
                </div>
              )}

              {/* Best Score */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-zerion-yellow rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏆</span>
                  <span className="text-xs font-pixel text-zerion-blue-light">BEST SCORE</span>
                </div>
                <p className="text-2xl font-pixel text-zerion-yellow font-bold text-center">
                  {userStats.bestScore.toLocaleString()}
                </p>
              </div>

              {/* Total Coins */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-zerion-yellow rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">💰</span>
                  <span className="text-xs font-pixel text-zerion-blue-light">TOTAL COINS</span>
                </div>
                <p className="text-2xl font-pixel text-zerion-yellow font-bold text-center">
                  {userStats.totalCoins.toLocaleString()}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Characters Unlocked */}
                <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-2">
                  <p className="text-xs font-pixel text-zerion-blue-light text-center mb-1">
                    HEROES
                  </p>
                  <p className="text-lg font-pixel text-zerion-light font-bold text-center">
                    {userStats.unlockedCharacters}
                  </p>
                </div>

                {/* Games Played (Estimated) */}
                <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-2">
                  <p className="text-xs font-pixel text-zerion-blue-light text-center mb-1">
                    GAMES
                  </p>
                  <p className="text-lg font-pixel text-zerion-light font-bold text-center">
                    {userStats.gamesPlayed}
                  </p>
                </div>

                {/* Average Score */}
                <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-2">
                  <p className="text-xs font-pixel text-zerion-blue-light text-center mb-1">
                    AVG
                  </p>
                  <p className="text-sm font-pixel text-zerion-light font-bold text-center">
                    {userStats.averageScore.toLocaleString()}
                  </p>
                </div>

                {/* Account Age */}
                <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-2">
                  <p className="text-xs font-pixel text-zerion-blue-light text-center mb-1">
                    🎯 AGE
                  </p>
                  <p className="text-xs font-pixel text-zerion-light font-bold text-center">
                    {userStats.accountAge}
                  </p>
                </div>
              </div>

              {/* Current Character */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦸</span>
                    <div>
                      <p className="text-xs font-pixel text-purple-300">CURRENT HERO</p>
                      <p className="text-sm font-pixel text-white font-bold">
                        {userStats.currentCharacter}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-pixel text-purple-300">UNLOCKED</p>
                    <p className="text-sm font-pixel text-white font-bold">
                      {userStats.unlockedCharacters}/3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-xs font-pixel text-zerion-blue-light">
                No stats available
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zerion-blue-dark/80 p-3 border-t-4 border-zerion-blue">
          <button
            onClick={fetchUserStats}
            className="w-full text-xs font-pixel text-zerion-yellow hover:text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Loading...' : '🔄 REFRESH STATS'}
          </button>
        </div>
      </div>
    </div>
  );
}