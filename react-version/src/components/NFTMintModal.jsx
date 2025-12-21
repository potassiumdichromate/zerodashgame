import React, { useState, useRef, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import nftPassVideo from '../assets/nftpass.mp4';

// ============================================
// CONTRACT CONFIGURATION
// ============================================

const NFT_CONTRACT_ADDRESS = "0x09904F6f4013ce41dc2d7ac0fF09C26F3aD86e53";
const BACKEND_URL = "https://zerodashbackend.onrender.com";

// Minimal ABI for minting
const NFT_ABI = [
  "function mint(bytes32[] calldata merkleProof) external payable",
  "function hasMinted(address account) external view returns (bool)",
  "function isWhitelisted(address account, bytes32[] calldata proof) external view returns (bool)",
  "function MINT_PRICE() external view returns (uint256)",
  "function totalMinted() external view returns (uint256)"
];

/**
 * NFTMintModal Component with Merkle Tree Whitelist
 * Premium NFT Pass minting modal with video preview
 * Mints on 0G Blockchain - Works with Privy Wallet
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onMintSuccess - Success callback after minting
 */
export default function NFTMintModal({ isOpen, onClose, onMintSuccess }) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState(0); // 0: ready, 1: processing, 2: confirming, 3: success
  const [transactionHash, setTransactionHash] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [hasMinted, setHasMinted] = useState(false);
  
  // Merkle whitelist states
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [merkleProof, setMerkleProof] = useState([]);
  const [whitelistChecking, setWhitelistChecking] = useState(true);
  
  const videoRef = useRef(null);

  // Minting steps for UI feedback
  const MINTING_STEPS = [
    { label: 'Ready to Mint', icon: '🎨', color: 'text-blue-400' },
    { label: 'Initializing Transaction', icon: '⚡', color: 'text-yellow-400' },
    { label: 'Confirming on 0G Blockchain', icon: '⛓️', color: 'text-orange-400' },
    { label: 'Minted Successfully!', icon: '✅', color: 'text-green-400' },
  ];

  /**
   * Get wallet address from localStorage
   */
  useEffect(() => {
    if (isOpen) {
      const address = localStorage.getItem('walletAddress');
      if (address) {
        console.log('🔍 Wallet Address:', address);
        setWalletAddress(address);
      } else {
        console.log('❌ No wallet address in localStorage');
      }
    }
  }, [isOpen]);

  /**
   * Check whitelist status and mint status
   */
  useEffect(() => {
    const checkStatuses = async () => {
      if (!walletAddress) {
        console.log('⏳ Waiting for wallet address...');
        return;
      }

      setWhitelistChecking(true);
      console.log('🔍 Checking whitelist for:', walletAddress);

      try {
        // Check whitelist from backend
        const whitelistResponse = await fetch(`${BACKEND_URL}/nft/proof/${walletAddress}`);
        const whitelistData = await whitelistResponse.json();
        
        console.log('📋 Backend response:', whitelistData);
        
        if (whitelistData.success) {
          setIsWhitelisted(whitelistData.isWhitelisted);
          setMerkleProof(whitelistData.proof || []);
          console.log('✅ Whitelist check:', whitelistData.message);
        }

        // Check if already minted from contract
        try {
          // Use Privy wallet provider
          const embeddedWallet = wallets.find((wallet) => 
            wallet.walletClientType === 'privy' || wallet.walletClientType === 'embedded'
          ) || wallets[0];
          
          if (embeddedWallet) {
            const provider = await embeddedWallet.getEthereumProvider();
            const ethersProvider = new ethers.BrowserProvider(provider);
            const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, ethersProvider);
            
            const minted = await contract.hasMinted(walletAddress);
            setHasMinted(minted);
            console.log('Mint status:', minted ? 'Already minted' : 'Not minted');
          }
        } catch (error) {
          console.warn('Could not check mint status:', error);
        }

      } catch (error) {
        console.error('Error checking statuses:', error);
        setIsWhitelisted(false);
        setMerkleProof([]);
      } finally {
        setWhitelistChecking(false);
      }
    };

    if (isOpen && walletAddress) {
      checkStatuses();
    }
  }, [isOpen, walletAddress, wallets]);

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
   * Handle NFT minting process with Merkle proof
   */
  const handleMint = async () => {
    if (!authenticated || !walletAddress) {
      alert('❌ Please connect your wallet first');
      return;
    }

    if (hasMinted) {
      alert('✅ You already minted your Zero Dash Pass NFT!');
      return;
    }

    setIsMinting(true);
    setMintingStep(1);

    try {
      // Check if wallet is available
      if (!window.ethereum) {
        throw new Error('Please connect your wallet');
      }

      // Step 1: Switch to 0G Mainnet (Chain ID: 16661 = 0x4115)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4115' }], // 16661 in hex
        });
        console.log('✅ Switched to 0G Mainnet');
      } catch (switchError) {
        // If chain doesn't exist, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x4115',
                chainName: '0G Blockchain',
                rpcUrls: ['https://evmrpc.0g.ai'],
                nativeCurrency: {
                  name: '0G',
                  symbol: '0G',
                  decimals: 18
                },
                blockExplorerUrls: ['https://explorer.0g.ai']
              }],
            });
            console.log('✅ Added and switched to 0G Mainnet');
          } catch (addError) {
            throw new Error('Failed to add 0G network. Please add it manually.');
          }
        } else {
          console.warn('Chain switch warning:', switchError);
        }
      }

      // Step 2: Get provider and signer
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      console.log('✅ Got provider and signer');

      // Step 3: Connect to contract
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

      // Step 4: Prepare transaction
      const mintPrice = isWhitelisted ? 0 : ethers.parseEther('5');
      
      console.log('🎨 Minting NFT...');
      console.log('   Address:', walletAddress);
      console.log('   Whitelisted:', isWhitelisted);
      console.log('   Price:', isWhitelisted ? 'FREE' : '5 0G');
      console.log('   Proof length:', merkleProof.length);

      setMintingStep(2);

      // Step 5: Call mint function with Merkle proof
      const tx = await nftContract.mint(merkleProof, {
        value: mintPrice,
        gasLimit: 300000
      });

      console.log('⏳ Transaction submitted:', tx.hash);
      setTransactionHash(tx.hash);

      // Step 6: Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!', receipt);

      setMintingStep(3);

      // Step 7: Update backend with NFT pass status
      try {
        const updateResponse = await fetch(`${BACKEND_URL}/player/nft-pass`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${walletAddress}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            walletAddress,
            nftPass: true,
            transactionHash: tx.hash,
            blockchain: '0G',
            contractAddress: NFT_CONTRACT_ADDRESS,
            mintPrice: isWhitelisted ? '0' : '5',
            whitelisted: isWhitelisted
          }),
        });

        if (updateResponse.ok) {
          console.log('✅ Backend updated with NFT status');
        } else {
          console.warn('⚠️  Failed to update backend, but NFT minted successfully');
        }
      } catch (backendError) {
        console.warn('⚠️  Backend update error:', backendError);
        // Don't throw - NFT is minted successfully
      }

      // Success!
      setHasMinted(true);

      // Wait to show success message
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
      console.error('❌ Minting failed:', error);
      
      let errorMessage = 'Transaction failed. Please try again.';
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction cancelled by user.';
      } else if (error.message?.includes('Already minted')) {
        errorMessage = 'You already minted your NFT Pass!';
        setHasMinted(true);
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = `Insufficient 0G balance. You need ${isWhitelisted ? '~0.0001' : '5+'} 0G.`;
      } else if (error.message?.includes('Max supply reached')) {
        errorMessage = 'Sorry, all NFTs have been minted!';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ Minting Failed\n\n${errorMessage}`);
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

          {/* Whitelist Badge - VISIBLE INDICATOR */}
          {!whitelistChecking && isWhitelisted && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 
                            border-3 border-green-400 rounded-lg px-4 py-2 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-xs font-pixel text-white font-bold leading-tight">
                    WHITELISTED
                  </p>
                  <p className="text-[10px] font-pixel text-green-100 leading-tight">
                    FREE MINT!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Already Minted Badge */}
          {hasMinted && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                            bg-gradient-to-r from-purple-500 to-pink-500 
                            border-3 border-purple-400 rounded-lg px-6 py-3">
              <p className="text-sm font-pixel text-white font-bold">
                ✨ YOU OWN THIS NFT ✨
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
          {!whitelistChecking && (
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
                    {isWhitelisted ? '🎁 WHITELIST PRICE' : '💎 MINT PRICE'}
                  </p>
                  {isWhitelisted ? (
                    <>
                      <p className="text-3xl font-pixel text-green-400 font-bold">FREE</p>
                      <p className="text-xs font-pixel text-green-200 mt-1">
                        <span className="line-through opacity-50">5 0G</span> → 0 0G + gas
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-pixel text-zerion-yellow font-bold">5 0G</p>
                      <p className="text-xs font-pixel text-yellow-200 mt-1">+ gas (~0.0001 0G)</p>
                    </>
                  )}
                </div>
                <div className="text-6xl">{isWhitelisted ? '🎁' : '💎'}</div>
              </div>
            </div>
          )}

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
                  <a 
                    href={`https://explorer.0g.ai/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all underline"
                  >
                    {transactionHash}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Privy Wallet Info */}
          {!isMinting && authenticated && walletAddress && (
            <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👛</span>
                <div className="flex-1">
                  <p className="text-xs font-pixel text-purple-300 font-bold mb-2">
                    WALLET CONNECTED
                  </p>
                  <div className="space-y-1 text-xs font-pixel text-purple-200">
                    <p>• Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                    <p>• Network: 0G Blockchain</p>
                    <p>• Status: {whitelistChecking ? 'Checking...' : isWhitelisted ? '✅ Whitelisted' : 'Public Mint'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Not Connected Warning */}
          {!authenticated && (
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-xs font-pixel text-red-300 font-bold mb-2">
                    WALLET NOT CONNECTED
                  </p>
                  <p className="text-xs font-pixel text-red-200">
                    Please connect your wallet to mint the NFT Pass
                  </p>
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
              disabled={isMinting || !authenticated || hasMinted || whitelistChecking || !walletAddress}
              className="flex-1 pixel-button-primary text-sm py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!authenticated 
                ? '🔒 CONNECT WALLET'
                : !walletAddress
                  ? '⏳ LOADING...'
                  : hasMinted
                    ? '✅ ALREADY MINTED'
                    : whitelistChecking
                      ? '⏳ CHECKING...'
                      : isMinting 
                        ? `⏳ ${MINTING_STEPS[mintingStep].label.toUpperCase()}...` 
                        : isWhitelisted
                          ? '🎁 MINT FREE'
                          : '💎 MINT FOR 5 0G'
              }
            </button>
          </div>

          {/* Footer Notice */}
          <div className="text-center">
            <p className="text-xs font-pixel text-zerion-blue-light">
              By minting, you agree to our terms and conditions • Powered by 0G Blockchain
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