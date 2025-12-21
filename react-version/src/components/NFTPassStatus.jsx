import React, { useState, useEffect } from 'react';
import NFTMintModal from './NFTMintModal';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

/**
 * NFTPassStatus Component - BACKEND INTEGRATED
 * Shows Zero Dash Pass status (Active/Inactive) based on real backend data
 * If inactive, shows "Mint Now" button which opens minting modal
 * Displays at the top of menu screen
 * 
 * @param {string} walletAddress - User's wallet address (optional, will use localStorage)
 */
export default function NFTPassStatus({ walletAddress }) {
  const [hasNFT, setHasNFT] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [showMintModal, setShowMintModal] = useState(false);

  /**
   * Check if user owns Zero Dash Pass NFT from backend
   */
  const checkNFTOwnership = async () => {
    setIsChecking(true);
    setError(null);

    try {
      // Get wallet address from localStorage
      const storedWalletAddress = localStorage.getItem('walletAddress');
      
      if (!storedWalletAddress) {
        console.log('No wallet address found');
        setHasNFT(false);
        setIsChecking(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/player/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedWalletAddress}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFT status');
      }

      const data = await response.json();
      
      // Set NFT status from backend
      setHasNFT(data.nftPass === true);
      
    } catch (err) {
      console.error('Error checking NFT ownership:', err);
      setError(err.message);
      setHasNFT(false); // Default to false on error
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Check NFT ownership when component mounts or wallet changes
   */
  useEffect(() => {
    checkNFTOwnership();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkNFTOwnership, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  /**
   * Handle mint button click - Opens modal
   */
  const handleMintClick = () => {
    setShowMintModal(true);
  };

  /**
   * Handle successful minting
   */
  const handleMintSuccess = () => {
    console.log('✅ NFT Minted Successfully!');
    // Refresh NFT status
    checkNFTOwnership();
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

  if (error) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150]">
        <div className="bg-red-900/90 border-3 border-red-500 px-6 py-2 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs font-pixel text-red-300">
              ❌ Failed to check NFT Pass
            </span>
            <button
              onClick={checkNFTOwnership}
              className="text-xs font-pixel text-red-200 hover:text-white underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* NFT Mint Modal */}
      <NFTMintModal
        isOpen={showMintModal}
        onClose={() => setShowMintModal(false)}
        onMintSuccess={handleMintSuccess}
      />

      {/* NFT Pass Status Banner */}
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

      {/* Refresh Indicator (Dev only) */}
      {import.meta.env.DEV && (
        <div className="text-center mt-1">
          <button
            onClick={checkNFTOwnership}
            className="text-xs font-pixel text-white/40 hover:text-white/60"
          >
            🔄 Refresh NFT Status
          </button>
        </div>
      )}

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
    </>
  );
}