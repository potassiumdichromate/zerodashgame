import React, { useState } from 'react';

/**
 * CharacterMarketplace Component - COMING SOON VERSION
 * Shows available characters but marked as coming soon
 * Features:
 * - All elements visible but disabled
 * - "Coming Soon" overlay
 * - Visual feedback that feature is in development
 * - Ready for easy activation when blockchain is integrated
 */
export default function CharacterMarketplace() {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  // 28 unique characters with names, prices, and emojis
  const characters = [
    { id: 1, name: 'Runner', price: 0.001, emoji: '🏃', rarity: 'common' },
    { id: 2, name: 'Ninja', price: 0.002, emoji: '🥷', rarity: 'common' },
    { id: 3, name: 'Knight', price: 0.003, emoji: '⚔️', rarity: 'common' },
    { id: 4, name: 'Wizard', price: 0.004, emoji: '🧙', rarity: 'rare' },
    { id: 5, name: 'Robot', price: 0.005, emoji: '🤖', rarity: 'rare' },
    { id: 6, name: 'Alien', price: 0.006, emoji: '👽', rarity: 'rare' },
    { id: 7, name: 'Pirate', price: 0.007, emoji: '🏴‍☠️', rarity: 'rare' },
    { id: 8, name: 'Astronaut', price: 0.008, emoji: '👨‍🚀', rarity: 'epic' },
    { id: 9, name: 'Samurai', price: 0.009, emoji: '🗾', rarity: 'epic' },
    { id: 10, name: 'Vampire', price: 0.01, emoji: '🧛', rarity: 'epic' },
    { id: 11, name: 'Zombie', price: 0.011, emoji: '🧟', rarity: 'epic' },
    { id: 12, name: 'Ghost', price: 0.012, emoji: '👻', rarity: 'epic' },
    { id: 13, name: 'Demon', price: 0.015, emoji: '😈', rarity: 'legendary' },
    { id: 14, name: 'Angel', price: 0.015, emoji: '😇', rarity: 'legendary' },
    { id: 15, name: 'Dragon', price: 0.02, emoji: '🐉', rarity: 'legendary' },
    { id: 16, name: 'Phoenix', price: 0.02, emoji: '🔥', rarity: 'legendary' },
    { id: 17, name: 'Cyborg', price: 0.013, emoji: '🦾', rarity: 'epic' },
    { id: 18, name: 'Mage', price: 0.014, emoji: '🔮', rarity: 'epic' },
    { id: 19, name: 'Archer', price: 0.004, emoji: '🏹', rarity: 'rare' },
    { id: 20, name: 'Warrior', price: 0.005, emoji: '🛡️', rarity: 'rare' },
    { id: 21, name: 'Thief', price: 0.003, emoji: '🗡️', rarity: 'common' },
    { id: 22, name: 'Monk', price: 0.006, emoji: '🙏', rarity: 'rare' },
    { id: 23, name: 'Paladin', price: 0.016, emoji: '⚡', rarity: 'legendary' },
    { id: 24, name: 'Necro', price: 0.018, emoji: '💀', rarity: 'legendary' },
    { id: 25, name: 'Elf', price: 0.007, emoji: '🧝', rarity: 'rare' },
    { id: 26, name: 'Dwarf', price: 0.008, emoji: '⛏️', rarity: 'epic' },
    { id: 27, name: 'Titan', price: 0.025, emoji: '⚔️', rarity: 'mythic' },
    { id: 28, name: 'God', price: 0.05, emoji: '⚡', rarity: 'mythic' },
  ];

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-400 bg-gray-400/10',
      rare: 'border-blue-400 bg-blue-400/10',
      epic: 'border-purple-400 bg-purple-400/10',
      legendary: 'border-yellow-400 bg-yellow-400/10',
      mythic: 'border-red-400 bg-red-400/10',
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadge = (rarity) => {
    const badges = {
      common: '⚪',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡',
      mythic: '🔴',
    };
    return badges[rarity] || badges.common;
  };

  const handleCharacterClick = () => {
    setShowComingSoonModal(true);
  };

  return (
    <>
      <div className="fixed left-4 top-24 bottom-4 w-72 z-[100] hidden lg:block">
        <div
          className="h-full bg-zerion-blue-dark/95 border-4 border-zerion-yellow rounded-lg overflow-hidden flex flex-col relative"
          style={{
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark p-4 border-b-4 border-zerion-yellow flex-shrink-0">
            <h3 className="text-sm font-pixel text-zerion-yellow font-bold text-center">
              🛒 CHARACTER SHOP
            </h3>
            <p className="text-xs font-pixel text-zerion-blue-light text-center mt-1">
              28 Unique Heroes • Coming Soon
            </p>
          </div>

          {/* Character Grid - Slightly dimmed */}
          <div 
            className="flex-1 overflow-y-auto p-3 opacity-60"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#3b82f6 rgba(0,0,0,0.3)',
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={handleCharacterClick}
                  className={`
                    relative rounded-lg border-2 p-2 
                    transition-all duration-200 cursor-not-allowed
                    hover:scale-105 hover:shadow-xl
                    ${getRarityColor(character.rarity)}
                  `}
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Rarity Badge */}
                  <div className="absolute -top-1 -right-1 text-xs">
                    {getRarityBadge(character.rarity)}
                  </div>

                  {/* Character Emoji */}
                  <div className="text-3xl text-center mb-1 transition-transform duration-200">
                    {character.emoji}
                  </div>

                  {/* Character Name */}
                  <p className="text-xs font-pixel text-center text-white font-bold truncate mb-1">
                    {character.name}
                  </p>

                  {/* Price */}
                  <div className="bg-black/60 rounded px-2 py-1 border border-zerion-yellow/50">
                    <p className="text-xs font-pixel text-zerion-yellow text-center font-bold">
                      {character.price} ETH
                    </p>
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-zerion-blue-dark/80 p-3 border-t-4 border-zerion-blue flex-shrink-0">
            <div className="flex items-center justify-between text-xs font-pixel mb-2">
              <span className="text-white font-bold">Rarity Legend:</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className="text-center">
                <span className="text-gray-400">⚪</span>
              </div>
              <div className="text-center">
                <span className="text-blue-400">🔵</span>
              </div>
              <div className="text-center">
                <span className="text-purple-400">🟣</span>
              </div>
              <div className="text-center">
                <span className="text-yellow-400">🟡</span>
              </div>
              <div className="text-center">
                <span className="text-red-400">🔴</span>
              </div>
            </div>
          </div>

          {/* COMING SOON Banner Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div 
              className="bg-gradient-to-r from-purple-900/95 to-blue-900/95 border-4 border-yellow-400 rounded-lg p-6 shadow-2xl transform rotate-[-5deg]"
              style={{
                boxShadow: '0 0 60px rgba(255, 215, 0, 0.6), inset 0 0 40px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-center">
                <p className="text-4xl font-pixel text-yellow-400 font-bold mb-2 animate-pulse" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                  COMING SOON
                </p>
                <p className="text-sm font-pixel text-white">
                  🚀 Character Shop
                </p>
                <p className="text-xs font-pixel text-blue-200 mt-2">
                  Stay tuned for epic heroes!
                </p>
              </div>
            </div>
          </div>

          {/* Custom Scrollbar Styles */}
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.3);
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb {
              background: #3b82f6;
              border-radius: 4px;
              border: 2px solid rgba(0, 0, 0, 0.3);
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #60a5fa;
            }
          `}</style>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowComingSoonModal(false)}
        >
          <div 
            className="bg-zerion-blue-dark border-4 border-zerion-yellow rounded-lg p-8 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)',
            }}
          >
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <h3 className="text-2xl font-pixel text-zerion-yellow font-bold mb-3">
                COMING SOON
              </h3>
              <p className="text-sm font-pixel text-white mb-4">
                Character Shop is Under Development
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-zerion-blue-medium/50 border-2 border-zerion-blue rounded-lg p-4 mb-6">
              <p className="text-xs font-pixel text-zerion-yellow text-center mb-3 font-bold">
                ✨ COMING FEATURES:
              </p>
              <ul className="text-xs font-pixel text-white space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>28 Unique Characters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Blockchain NFT Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Special Abilities & Skins</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Exclusive Animations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Trade & Marketplace</span>
                </li>
              </ul>
            </div>

            {/* Launch Timeline */}
            <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4 mb-6">
              <p className="text-xs font-pixel text-purple-300 text-center mb-2">
                📅 EXPECTED LAUNCH
              </p>
              <p className="text-lg font-pixel text-white text-center font-bold">
                Q1 2025
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="pixel-button-primary w-full text-sm py-3"
            >
              ✨ GOT IT!
            </button>

            {/* Follow Note */}
            <div className="mt-4 text-center">
              <p className="text-xs font-pixel text-zerion-blue-light">
                Stay tuned for updates! 🎮
              </p>
            </div>
          </div>

          {/* Modal Animation */}
          <style jsx>{`
            @keyframes scale-in {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-scale-in {
              animation: scale-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
          `}</style>
        </div>
      )}
    </>
  );
}