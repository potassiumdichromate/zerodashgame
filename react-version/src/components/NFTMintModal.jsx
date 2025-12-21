import React, { useState, useRef, useEffect } from 'react';
import nftPassVideo from '../assets/nftpass.mp4';

// Whitelist addresses (FREE MINT)
const WHITELIST_ADDRESSES = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  // Add more whitelist addresses here
];

/**
 * NFTMintModal Component
 * Premium NFT Pass minting modal with video preview
 * Mints on 0G Blockchain - Requires Zerion Wallet
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onMintSuccess - Success callback after minting
 */
export default function NFTMintModal({ isOpen, onClose, onMintSuccess }) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState(0); // 0: ready, 1: processing, 2: confirming, 3: success
  const [transactionHash, setTransactionHash] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const videoRef = useRef(null);

  // Minting steps for UI feedback
  const MINTING_STEPS = [
    { label: 'Ready to Mint', icon: '🎨', color: 'text-blue-400' },
    { label: 'Initializing Transaction', icon: '⚡', color: 'text-yellow-400' },
    { label: 'Confirming on 0G Blockchain', icon: '⛓️', color: 'text-orange-400' },
    { label: 'Minted Successfully!', icon: '✅', color: 'text-green-400' },
  ];

  /**
   * Check if wallet is whitelisted
   */
  useEffect(() => {
    const checkWhitelist = () => {
      const storedWallet = localStorage.getItem('walletAddress');
      setWalletAddress(storedWallet || '');
      
      if (storedWallet) {
        const whitelisted = WHITELIST_ADDRESSES.some(
          addr => addr.toLowerCase() === storedWallet.toLowerCase()
        );
        setIsWhitelisted(whitelisted);
      }
    };

    if (isOpen) {
      checkWhitelist();
    }
  }, [isOpen]);

  /**
   * Play video when modal opens
   */
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, [isOpen]);

  /**
   * Close on Escape key
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isMinting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMinting, onClose]);

  /**
   * Prevent body scroll when modal is open
   */
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

  /**
   * Handle NFT minting process
   */
  const handleMint = async () => {
    setIsMinting(true);
    setMintingStep(1);

    try {
      // Step 1: Initialize Transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      /* TODO: 0G BLOCKCHAIN INTEGRATION
      
      // Get wallet address
      const walletAddress = localStorage.getItem('walletAddress');
      
      // Check if Zerion wallet is connected
      if (!window.ethereum || !window.ethereum.isZerion) {
        throw new Error('Zerion Wallet not detected. Please use Zerion Wallet to mint.');
      }
      
      // Connect to 0G Blockchain
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 0G NFT Contract
      const OG_NFT_CONTRACT_ADDRESS = '0x...'; // Your 0G contract address
      const NFT_ABI = [...]; // Your contract ABI
      const nftContract = new ethers.Contract(OG_NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      
      // Check whitelist
      const isWhitelisted = WHITELIST_ADDRESSES.some(
        addr => addr.toLowerCase() === walletAddress.toLowerCase()
      );
      
      // Mint price: 5 0G for public, FREE for whitelist
      const mintPrice = isWhitelisted 
        ? ethers.utils.parseEther("0")     // FREE for whitelist
        : ethers.utils.parseEther("5");    // 5 0G for public
      
      // Call mint function
      const tx = await nftContract.mint({
        value: mintPrice,
        gasLimit: 300000
      });
      
      */
      
      setMintingStep(2);
      
      // Step 2: Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      /* TODO: 0G BLOCKCHAIN INTEGRATION
      
      // Wait for transaction confirmation on 0G blockchain
      const receipt = await tx.wait();
      setTransactionHash(receipt.transactionHash);
      
      // Update backend with NFT pass status
      const response = await fetch('https://zerodashbackend.onrender.com/player/update-nft-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nftPass: true,
          transactionHash: receipt.transactionHash,
          blockchain: '0G',
          mintPrice: isWhitelisted ? '0' : '5'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update NFT status on backend');
      }
      
      */
      
      // Simulate transaction hash for demo
      setTransactionHash('0x' + Math.random().toString(16).substring(2, 66));
      
      setMintingStep(3);
      
      // Wait a moment to show success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Callback to parent component
      if (onMintSuccess) {
        onMintSuccess();
      }
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Minting failed:', error);
      alert(`❌ Minting Failed\n\n${error.message || 'Transaction was rejected or failed.'}`);
      setMintingStep(0);
      setIsMinting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (isMinting && mintingStep !== 3) {
      // Don't close during minting (except on success)
      return;
    }
    
    setIsMinting(false);
    setMintingStep(0);
    setTransactionHash('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={!isMinting ? handleClose : undefined}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar
                   bg-zerion-blue-dark border-6 border-zerion-yellow rounded-xl
                   transition-all duration-300 fade-in"
        style={{
          boxShadow: `
            0 0 0 4px #f59e0b,
            0 0 60px rgba(255, 215, 0, 0.6),
            inset 0 0 80px rgba(0, 0, 0, 0.6)
          `,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark p-6 border-b-4 border-zerion-yellow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-pixel text-zerion-yellow font-bold mb-2">
                🎫 ZERO DASH PASS
              </h2>
              <p className="text-sm font-pixel text-zerion-blue-light">
                Mint your exclusive NFT Pass on 0G Blockchain
              </p>
            </div>
            
            {!isMinting && (
              <button
                onClick={handleClose}
                className="text-3xl font-pixel text-zerion-light hover:text-zerion-yellow 
                           transition-colors w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative bg-black/80 border-b-4 border-zerion-blue">
          <video
            ref={videoRef}
            src={nftPassVideo}
            className="w-full h-auto max-h-[400px] object-contain"
            loop
            muted
            playsInline
            autoPlay
          />
          
          {/* Video Overlay Badge */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 
                          border-3 border-yellow-400 rounded-lg px-4 py-2">
            <p className="text-xs font-pixel text-white font-bold">
              EXCLUSIVE NFT
            </p>
          </div>

          {/* Whitelist Badge */}
          {isWhitelisted && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 
                            border-3 border-green-400 rounded-lg px-4 py-2 animate-pulse">
              <p className="text-xs font-pixel text-white font-bold">
                ✅ WHITELISTED - FREE MINT
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Benefits List */}
          <div className="bg-zerion-blue-medium/30 border-3 border-zerion-blue rounded-lg p-5">
            <h3 className="text-lg font-pixel text-zerion-yellow font-bold mb-4 flex items-center gap-2">
              <span>✨</span>
              <span>PREMIUM BENEFITS</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 bg-black/20 rounded p-3 border-2 border-green-500/30">
                <span className="text-2xl">🎮</span>
                <div>
                  <p className="text-sm font-pixel text-white font-bold">Exclusive Levels</p>
                  <p className="text-xs font-pixel text-zerion-blue-light">Access premium game content</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-black/20 rounded p-3 border-2 border-blue-500/30">
                <span className="text-2xl">🦸</span>
                <div>
                  <p className="text-sm font-pixel text-white font-bold">Special Characters</p>
                  <p className="text-xs font-pixel text-zerion-blue-light">Unlock unique heroes</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-black/20 rounded p-3 border-2 border-yellow-500/30">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm font-pixel text-white font-bold">Bonus Rewards</p>
                  <p className="text-xs font-pixel text-zerion-blue-light">2x coin multiplier</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-black/20 rounded p-3 border-2 border-purple-500/30">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-pixel text-white font-bold">Priority Access</p>
                  <p className="text-xs font-pixel text-zerion-blue-light">Early feature releases</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minting Price */}
          <div className={`bg-gradient-to-r border-3 rounded-lg p-5 ${
            isWhitelisted
              ? 'from-green-900/40 to-emerald-900/40 border-green-500'
              : 'from-yellow-900/40 to-orange-900/40 border-yellow-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-pixel mb-1 ${
                  isWhitelisted ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {isWhitelisted ? 'WHITELIST PRICE' : 'MINT PRICE'}
                </p>
                {isWhitelisted ? (
                  <>
                    <p className="text-3xl font-pixel text-green-400 font-bold">FREE</p>
                    <p className="text-xs font-pixel text-green-200 mt-1">
                      <span className="line-through opacity-50">5 0G</span> → 0 0G
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-pixel text-zerion-yellow font-bold">5 0G</p>
                    <p className="text-xs font-pixel text-yellow-200 mt-1">0G Blockchain Token</p>
                  </>
                )}
              </div>
              <div className="text-6xl">{isWhitelisted ? '🎁' : '💎'}</div>
            </div>
          </div>

          {/* Minting Status */}
          {isMinting && (
            <div className="bg-zerion-blue-medium/50 border-3 border-blue-500 rounded-lg p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                <div className="flex-1">
                  <p className="text-lg font-pixel text-white font-bold mb-1">
                    {MINTING_STEPS[mintingStep].label}
                  </p>
                  <p className="text-xs font-pixel text-zerion-blue-light">
                    Please wait while we process your transaction on 0G Blockchain...
                  </p>
                </div>
                <span className="text-4xl">{MINTING_STEPS[mintingStep].icon}</span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-zerion-blue-dark rounded-full overflow-hidden border-2 border-zerion-blue">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-zerion-yellow transition-all duration-500"
                  style={{ width: `${(mintingStep / 3) * 100}%` }}
                />
              </div>

              {/* Transaction Hash */}
              {transactionHash && (
                <div className="mt-4 bg-black/40 rounded p-3 border border-green-500/30">
                  <p className="text-xs font-pixel text-green-400 mb-1">0G Transaction Hash:</p>
                  <p className="text-xs font-mono text-white break-all">{transactionHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Zerion Wallet Requirement */}
          {!isMinting && (
            <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👛</span>
                <div>
                  <p className="text-xs font-pixel text-purple-300 font-bold mb-2">
                    ZERION WALLET REQUIRED
                  </p>
                  <div className="space-y-1 text-xs font-pixel text-purple-200">
                    <p>• You need Zerion Wallet to mint the NFT</p>
                    <p>• Social Login will not work for minting</p>
                    <p>• The NFT will be minted on 0G Blockchain</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={isMinting && mintingStep !== 3}
              className="flex-1 pixel-button-secondary text-sm py-4"
            >
              {mintingStep === 3 ? '✅ CLOSE' : '← CANCEL'}
            </button>
            
            <button
              onClick={handleMint}
              disabled={isMinting}
              className="flex-1 pixel-button-primary text-sm py-4"
            >
              {isMinting 
                ? `⏳ ${MINTING_STEPS[mintingStep].label.toUpperCase()}...` 
                : isWhitelisted
                  ? '🎁 MINT FREE'
                  : '🎨 MINT FOR 5 0G'
              }
            </button>
          </div>

          {/* Footer Notice */}
          <div className="text-center">
            <p className="text-xs font-pixel text-zerion-blue-light">
              By minting, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </div>
  );
}