import React, { useState, useEffect } from 'react';

/**
 * NFTPassStatus Component
 * Shows Zero Dash Pass status (Active/Inactive)
 * If inactive, shows "Mint Now" button
 * Displays at the top of menu screen
 * 
 * @param {string} walletAddress - User's wallet address
 */
export default function NFTPassStatus({ walletAddress }) {
  const [hasNFT, setHasNFT] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  /**
   * Check if user owns Zero Dash Pass NFT
   * TODO: Replace with actual blockchain check
   */
  useEffect(() => {
    const checkNFTOwnership = async () => {
      setIsChecking(true);
      
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual NFT ownership check
      // For now, randomly assign for demo
      const ownsNFT = Math.random() > 0.7; // 30% chance of having NFT
      setHasNFT(ownsNFT);
      
      setIsChecking(false);
    };

    if (walletAddress) {
      checkNFTOwnership();
    }
  }, [walletAddress]);

  const handleMintClick = () => {
    // TODO: Integrate NFT minting
    console.log('Mint NFT clicked');
    alert('Minting Zero Dash Pass NFT!\n\n(Blockchain integration coming soon!)');
  };

  if (isChecking) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150]">
        <div className="bg-zerion-blue-dark/90 border-3 border-zerion-blue px-6 py-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-3 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-pixel text-zerion-light">
              Checking NFT Pass...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150]">
      <div
        className={`
          px-6 py-3 rounded-lg border-4 transition-all duration-300
          ${hasNFT 
            ? 'bg-gradient-to-r from-green-900/90 to-green-700/90 border-green-400' 
            : 'bg-gradient-to-r from-red-900/90 to-orange-700/90 border-orange-400'
          }
        `}
        style={{
          boxShadow: hasNFT 
            ? '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)' 
            : '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-2xl
            ${hasNFT ? 'bg-green-500/20' : 'bg-orange-500/20'}
          `}>
            {hasNFT ? '🎫' : '🔒'}
          </div>

          {/* Status Text */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`
                text-sm font-pixel font-bold
                ${hasNFT ? 'text-green-400' : 'text-orange-400'}
              `}>
                ZERO DASH PASS
              </h3>
              <div className={`
                px-2 py-0.5 rounded text-xs font-pixel font-bold
                ${hasNFT 
                  ? 'bg-green-500 text-white' 
                  : 'bg-orange-500 text-white'
                }
              `}>
                {hasNFT ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
            
            <p className="text-xs font-pixel text-white/80">
              {hasNFT 
                ? '✨ Enjoy exclusive benefits & rewards' 
                : '🚫 Unlock special levels & characters'
              }
            </p>
          </div>

          {/* Mint Button (if no NFT) */}
          {!hasNFT && (
            <button
              onClick={handleMintClick}
              className="ml-4 pixel-button-primary text-xs px-4 py-2"
              style={{
                fontSize: '10px',
                padding: '8px 16px',
                border: '3px solid #ffd700',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              🎨 MINT NOW
            </button>
          )}

          {/* Status Indicator (if has NFT) */}
          {hasNFT && (
            <div className="ml-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-pixel text-green-400">
                VERIFIED
              </span>
            </div>
          )}
        </div>

        {/* Benefits Tooltip (Optional) */}
        {hasNFT && (
          <div className="mt-2 pt-2 border-t border-green-500/30">
            <div className="flex items-center gap-3 text-xs font-pixel text-green-300">
              <span>✅ Special Levels</span>
              <span>✅ Exclusive Characters</span>
              <span>✅ Bonus Rewards</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
