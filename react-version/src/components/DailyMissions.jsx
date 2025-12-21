import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

/**
 * DailyMissions Component - BACKEND INTEGRATED
 * Shows daily tasks/objectives based on real player data
 * Fetches from player profile API
 */
export default function DailyMissions() {
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  /**
   * Fetch player data from backend
   */
  const fetchPlayerData = async () => {
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
          'Authorization': `Bearer ${storedWalletAddress}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = await response.json();
      setPlayerData(data);
    } catch (err) {
      console.error('Error fetching player data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate missions based on real player data from backend
   */
  const generateMissionsFromData = () => {
    if (!playerData) return [];

    const missions = [];

    // Mission 1: Daily Reward (based on dailyReward field)
    const canClaimDailyReward = playerData.dailyReward?.nextRewardAt 
      ? new Date(playerData.dailyReward.nextRewardAt) <= new Date()
      : false;

    missions.push({
      id: 'daily_reward',
      title: 'Daily Login',
      description: 'Claim your daily reward',
      progress: canClaimDailyReward ? 1 : 0,
      total: 1,
      reward: '100 Coins',
      icon: '🎁',
      completed: false,
      type: 'daily_reward',
    });

    // Mission 2: Character Collection (based on unlocked characters)
    const unlockedCount = playerData.characters?.unlocked?.length || 0;
    const totalCharacters = 3; // You mentioned 3 characters (HERO1, HERO2, HERO3)
    
    missions.push({
      id: 'collect_characters',
      title: 'Hero Collector',
      description: 'Unlock all characters',
      progress: unlockedCount,
      total: totalCharacters,
      reward: '250 Coins',
      icon: '🦸',
      completed: unlockedCount >= totalCharacters,
      type: 'character',
    });

    // Mission 3: High Score Challenge (based on highScore)
    const currentHighScore = playerData.highScore || 0;
    const scoreTarget = 1000;
    
    missions.push({
      id: 'high_score',
      title: 'Score Master',
      description: `Reach ${scoreTarget} points`,
      progress: Math.min(currentHighScore, scoreTarget),
      total: scoreTarget,
      reward: '0.001 ETH',
      icon: '🏆',
      completed: currentHighScore >= scoreTarget,
      type: 'score',
    });

    // Mission 4: Coin Collector (based on coins)
    const currentCoins = playerData.coins || 0;
    const coinTarget = 500;
    
    missions.push({
      id: 'coin_collector',
      title: 'Coin Collector',
      description: `Earn ${coinTarget} coins`,
      progress: Math.min(currentCoins, coinTarget),
      total: coinTarget,
      reward: '150 Coins',
      icon: '💰',
      completed: currentCoins >= coinTarget,
      type: 'coins',
    });

    // Mission 5: Account Age (based on createdAt)
    if (playerData.createdAt) {
      const accountAge = Math.floor(
        (new Date() - new Date(playerData.createdAt)) / (1000 * 60 * 60 * 24)
      );
      
      missions.push({
        id: 'veteran',
        title: 'Veteran Player',
        description: 'Play for 7 days',
        progress: Math.min(accountAge, 7),
        total: 7,
        reward: '300 Coins',
        icon: '⭐',
        completed: accountAge >= 7,
        type: 'account_age',
      });
    }

    return missions;
  };

  /**
   * Calculate time until daily reset (midnight UTC)
   */
  useEffect(() => {
    const updateResetTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      
      const diff = midnight - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    updateResetTimer();
    const interval = setInterval(updateResetTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch player data on component mount
   */
  useEffect(() => {
    fetchPlayerData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPlayerData, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handle claim reward
   */
  const handleClaimReward = async (mission) => {
    if (mission.type === 'daily_reward') {
      // TODO: Add API call to claim daily reward
      alert(`🎁 Daily reward claimed!\n\nReward: ${mission.reward}\n\n💡 Add your claim logic to handleClaimReward()`);
      
      // Refresh player data after claiming
      fetchPlayerData();
    } else {
      alert(`✨ Mission completed!\n\n${mission.title}\nReward: ${mission.reward}\n\n💡 Add your reward distribution logic here`);
    }
  };

  /**
   * Calculate progress percentage
   */
  const getProgressPercentage = (progress, total) => {
    return Math.min((progress / total) * 100, 100);
  };

  /**
   * Get completed missions count
   */
  const getCompletedCount = () => {
    if (!playerData) return 0;
    return generateMissionsFromData().filter(m => m.completed).length;
  };

  /**
   * Calculate total earned (rough estimate)
   */
  const getTotalEarned = () => {
    if (!playerData) return 0;
    return getCompletedCount() * 100; // Average reward
  };

  const missions = generateMissionsFromData();

  return (
    <div className="fixed right-4 top-24 bottom-4 w-72 z-[100] hidden lg:block">
      <div
        className="h-full bg-zerion-blue-dark/95 border-4 border-zerion-yellow rounded-lg overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark p-4 border-b-4 border-zerion-yellow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-pixel text-zerion-yellow font-bold">
              📋 DAILY MISSIONS
            </h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-pixel">ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-pixel text-zerion-blue-light">
              Complete to earn rewards
            </p>
            <p className="text-xs font-pixel text-orange-400">
              ⏰ {timeUntilReset}
            </p>
          </div>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-pixel text-zerion-blue-light">Loading missions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
              <p className="text-xs font-pixel text-red-400 text-center">{error}</p>
              <button
                onClick={fetchPlayerData}
                className="text-xs font-pixel text-zerion-yellow hover:text-white transition-colors"
              >
                🔄 Retry
              </button>
            </div>
          ) : missions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
              <p className="text-xs font-pixel text-zerion-blue-light text-center">
                No missions available
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => {
                const progressPercent = getProgressPercentage(mission.progress, mission.total);
                const isComplete = mission.progress >= mission.total;
                const isClaimed = mission.completed;

                return (
                  <div
                    key={mission.id}
                    className={`
                      rounded-lg border-2 p-3 transition-all duration-200
                      ${isClaimed 
                        ? 'bg-green-900/20 border-green-500/50 opacity-60' 
                        : isComplete 
                          ? 'bg-yellow-500/10 border-zerion-yellow animate-pulse' 
                          : 'bg-zerion-blue-medium/50 border-zerion-blue hover:bg-zerion-blue-medium/70'
                      }
                    `}
                  >
                    {/* Mission Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{mission.icon}</span>
                        <div>
                          <h4 className="text-xs font-pixel text-white font-bold">
                            {mission.title}
                          </h4>
                          <p className="text-xs font-pixel text-zerion-blue-light">
                            {mission.description}
                          </p>
                        </div>
                      </div>
                      {isClaimed && (
                        <span className="text-lg">✅</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-pixel text-zerion-light">
                          {mission.progress} / {mission.total}
                        </span>
                        <span className="text-xs font-pixel text-zerion-yellow">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="h-2 bg-zerion-blue-dark rounded-full overflow-hidden border border-zerion-blue">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isComplete 
                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                              : 'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Reward & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-pixel text-zerion-blue-light">
                          Reward:
                        </span>
                        <span className="text-xs font-pixel text-zerion-yellow font-bold">
                          {mission.reward}
                        </span>
                      </div>
                      
                      {!isClaimed && isComplete && (
                        <button
                          onClick={() => handleClaimReward(mission)}
                          className="text-xs font-pixel bg-zerion-yellow text-black px-3 py-1 rounded font-bold hover:bg-yellow-300 transition-colors"
                        >
                          CLAIM
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-zerion-blue-dark/80 p-3 border-t-4 border-zerion-blue">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-zerion-blue-medium/50 rounded p-2">
              <p className="text-xs font-pixel text-zerion-blue-light">Completed</p>
              <p className="text-lg font-pixel text-green-400 font-bold">
                {isLoading ? '-' : `${getCompletedCount()}/${missions.length}`}
              </p>
            </div>
            <div className="bg-zerion-blue-medium/50 rounded p-2">
              <p className="text-xs font-pixel text-zerion-blue-light">Progress</p>
              <p className="text-lg font-pixel text-zerion-yellow font-bold">
                {isLoading ? '-' : `${Math.round((getCompletedCount() / (missions.length || 1)) * 100)}%`}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPlayerData}
            disabled={isLoading}
            className="w-full mt-2 text-xs font-pixel text-zerion-blue-light hover:text-zerion-yellow transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳ Loading...' : '🔄 Refresh Missions'}
          </button>
        </div>
      </div>
    </div>
  );
}