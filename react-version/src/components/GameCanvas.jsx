import React, { useEffect, useRef, useState } from 'react';
import CustomLoading from './CustomLoading';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

/**
 * GameCanvas Component - NFT-AWARE VERSION (PORTRAIT OPTIMIZED)
 * Manages Unity WebGL instance loading and rendering
 * Loads different game builds based on NFT ownership
 * Passes wallet address via URL parameter to Unity
 * Mobile: Portrait canvas (sidebar hidden via parent)
 * Desktop: Landscape canvas (sidebar visible)
 * 
 * @param {Object} props
 * @param {string} props.walletAddress - Wallet address to pass to Unity
 * @param {boolean} props.isVisible - Canvas visibility state
 * @param {function} props.onBack - Back button callback
 */
export default function GameCanvas({ walletAddress, isVisible, onBack }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const unityInstanceRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [checkingNFT, setCheckingNFT] = useState(true);

  /**
   * Check NFT ownership from backend
   */
  const checkNFTOwnership = async () => {
    setCheckingNFT(true);

    try {
      // Get wallet address from localStorage
      const storedWalletAddress = localStorage.getItem('walletAddress');
      
      if (!storedWalletAddress) {
        console.log('No wallet address found, loading free version');
        setHasNFT(false);
        setCheckingNFT(false);
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
      const nftStatus = data.nftPass === true;
      setHasNFT(nftStatus);
      
      console.log('🎫 NFT Status:', nftStatus ? 'PREMIUM' : 'FREE');
      
    } catch (err) {
      console.error('Error checking NFT ownership:', err);
      setHasNFT(false); // Default to free version on error
    } finally {
      setCheckingNFT(false);
    }
  };

  /**
   * Detect device type and set appropriate dimensions
   * Mobile: Portrait mode (9:16)
   * Desktop: Landscape mode (16:9)
   */
  useEffect(() => {
    const checkDevice = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // 🔥 MOBILE: PORTRAIT MODE
        // Calculate portrait dimensions that fit screen
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Use most of screen width (leave small margins)
        const canvasWidth = Math.min(screenWidth - 20, 450);
        
        // Portrait aspect ratio 9:16
        const canvasHeight = Math.floor(canvasWidth * (16 / 9));
        
        // Make sure height fits on screen (leave space for back button)
        const maxHeight = screenHeight - 100;
        const finalHeight = Math.min(canvasHeight, maxHeight);
        const finalWidth = Math.floor(finalHeight * (9 / 16));
        
        setDimensions({ width: finalWidth, height: finalHeight });
        
        console.log('📱 Mobile Portrait:', { width: finalWidth, height: finalHeight });
      } else {
        // 💻 DESKTOP: LANDSCAPE MODE
        setDimensions({ width: 900, height: 600 });
        console.log('💻 Desktop Landscape: 900x600');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  /**
   * Lock screen orientation to portrait on mobile
   */
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const lockOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('portrait');
          console.log('✅ Screen locked to portrait mode');
        }
      } catch (err) {
        console.log('ℹ️ Screen orientation lock not supported:', err.message);
      }
    };

    lockOrientation();

    return () => {
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (err) {
          // Ignore unlock errors
        }
      }
    };
  }, [isMobile, isVisible]);

  /**
   * Unity banner display function for warnings/errors
   */
  const unityShowBanner = (msg, type) => {
    const warningBanner = document.getElementById('unity-warning');
    if (!warningBanner) return;

    const updateBannerVisibility = () => {
      warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
    };

    const div = document.createElement('div');
    div.innerHTML = msg;
    warningBanner.appendChild(div);

    if (type === 'error') {
      div.style.cssText = 'background: red; padding: 10px; border: 2px solid darkred; font-size: 10px;';
    } else if (type === 'warning') {
      div.style.cssText = 'background: yellow; color: black; padding: 10px; border: 2px solid orange; font-size: 10px;';
      setTimeout(() => {
        if (warningBanner.contains(div)) {
          warningBanner.removeChild(div);
          updateBannerVisibility();
        }
      }, 5000);
    }

    updateBannerVisibility();
  };

  /**
   * Load Unity WebGL instance
   */
  const loadUnity = async () => {
    if (unityInstanceRef.current) {
      console.log('Unity instance already loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get wallet address from localStorage
      const storedWalletAddress = localStorage.getItem('walletAddress');
      
      // 🔥 SELECT BUILD URL BASED ON NFT OWNERSHIP
      const BASE_URL = hasNFT 
        ? 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/nft'   // NFT holders get premium build
        : 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/v4';   // Free players get standard build
      
      console.log(`🎮 Loading ${hasNFT ? 'PREMIUM' : 'FREE'} game build from:`, BASE_URL);
      
      // Add wallet address as URL parameter
      const walletParam = storedWalletAddress ? `?wallet=${encodeURIComponent(storedWalletAddress)}` : '';
      
      const buildUrl = BASE_URL;
      const loaderUrl = `${buildUrl}/ZeroDash.loader.js`;
      
      const config = {
        arguments: [],
        dataUrl: `${buildUrl}/ZeroDash.data${walletParam}`,
        frameworkUrl: `${buildUrl}/ZeroDash.framework.js${walletParam}`,
        codeUrl: `${buildUrl}/ZeroDash.wasm${walletParam}`,
        streamingAssetsUrl: '/StreamingAssets',
        companyName: 'Kult Games',
        productName: hasNFT ? 'Zero Dash Premium' : 'Zero Dash',
        productVersion: '1.0',
        showBanner: unityShowBanner,
        matchWebGLToCanvasSize: false,
        devicePixelRatio: 1,
      };

      // Mobile viewport adjustment
      if (isMobile) {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
      }

      // Load Unity loader script
      const script = document.createElement('script');
      script.src = loaderUrl;

      script.onload = async () => {
        try {
          // Check if createUnityInstance is available
          if (typeof window.createUnityInstance !== 'function') {
            throw new Error('Unity loader failed to initialize createUnityInstance');
          }

          // Create Unity instance
          const unityInstance = await window.createUnityInstance(
            canvasRef.current,
            config,
            (progress) => {
              setLoadingProgress(Math.round(progress * 100));
            }
          );

          unityInstanceRef.current = unityInstance;
          setIsLoading(false);

          // Set canvas dimensions based on device
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;
            canvas.style.width = `${dimensions.width}px`;
            canvas.style.height = `${dimensions.height}px`;
          }

          // Send wallet address to Unity after instance is ready
          if (storedWalletAddress) {
            setTimeout(() => {
              try {
                unityInstance.SendMessage('GameManager', 'SetWalletAddress', storedWalletAddress);
                console.log('✅ Wallet address sent to Unity:', storedWalletAddress);
                
                window.playerWalletAddress = storedWalletAddress;
                console.log('✅ Wallet set as window.playerWalletAddress');
                
                try {
                  unityInstance.SendMessage('GameManager', 'SaveWalletAddress', storedWalletAddress);
                  console.log('✅ Wallet saved in Unity PlayerPrefs');
                } catch (err) {
                  console.log('ℹ️ SaveWalletAddress not available (optional)');
                }
                
              } catch (err) {
                console.warn('⚠️ Could not send wallet to Unity:', err);
              }
            }, 1500);
          }
        } catch (err) {
          console.error('Unity instance creation failed:', err);
          setError(err.message || 'Failed to create Unity instance');
          unityShowBanner(err.message, 'error');
          setIsLoading(false);
        }
      };

      script.onerror = () => {
        const errorMsg = 'Failed to load Unity game files';
        setError(errorMsg);
        unityShowBanner(errorMsg, 'error');
        console.error('Failed to load Unity loader script');
        setIsLoading(false);
      };

      document.body.appendChild(script);
    } catch (err) {
      console.error('Unity loading error:', err);
      setError(err.message || 'Failed to load Unity');
      setIsLoading(false);
    }
  };

  /**
   * Update canvas when dimensions change
   */
  useEffect(() => {
    if (unityInstanceRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;
    }
  }, [dimensions]);

  /**
   * Check NFT status when component becomes visible
   */
  useEffect(() => {
    if (isVisible && !unityInstanceRef.current) {
      checkNFTOwnership();
    }
  }, [isVisible]);

  /**
   * Load Unity after NFT check is complete
   */
  useEffect(() => {
    if (isVisible && !checkingNFT && !unityInstanceRef.current && !isLoading) {
      loadUnity();
    }
  }, [isVisible, checkingNFT, dimensions]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (unityInstanceRef.current) {
        try {
          unityInstanceRef.current.Quit();
        } catch (err) {
          console.error('Error quitting Unity:', err);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500]
                  transition-opacity duration-500
                  ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}
    >
      {/* Back Button */}
      {onBack && isVisible && !isLoading && !checkingNFT && (
        <button
          onClick={onBack}
          className="absolute -top-16 left-0 pixel-button-secondary text-xs px-6 py-2 z-10"
          style={{
            fontSize: isMobile ? '8px' : '10px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            border: '3px solid #3b82f6'
          }}
        >
          ← {isMobile ? 'BACK' : 'BACK TO MENU'}
        </button>
      )}

      {/* NFT Status Badge (Top Right) */}
      {isVisible && !checkingNFT && (
        <div className="absolute -top-16 right-0 z-10">
          <div className={`
            px-4 py-2 rounded-lg border-3 font-pixel text-xs font-bold
            ${hasNFT 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 text-white' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500 text-gray-200'
            }
          `}
          style={{ fontSize: isMobile ? '8px' : '10px', padding: isMobile ? '6px 12px' : '8px 16px' }}
          >
            {hasNFT ? '🎫 PREMIUM' : '🎮 FREE'}
          </div>
        </div>
      )}

      {/* Unity Canvas */}
      <canvas
        ref={canvasRef}
        id="unity-canvas"
        width={dimensions.width}
        height={dimensions.height}
        tabIndex="-1"
        className="border-4 border-zerion-yellow block"
        style={{ 
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          imageRendering: isMobile ? 'pixelated' : 'auto',
          touchAction: 'none'
        }}
      />

      {/* NFT Checking Screen */}
      {checkingNFT && isVisible && (
        <div className="absolute inset-0 bg-zerion-blue-dark/95 border-4 border-zerion-yellow flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-pixel text-zerion-yellow font-bold mb-2">
              Checking NFT Pass...
            </p>
            <p className="text-xs font-pixel text-zerion-blue-light">
              Loading your game experience
            </p>
          </div>
        </div>
      )}

      {/* Custom Loading Screen */}
      {isLoading && <CustomLoading progress={loadingProgress} isMobile={isMobile} />}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-5 max-w-md">
          <div className="bg-red-900/90 border-4 border-red-500 p-4 text-xs animate-shake">
            <p className="font-pixel text-white mb-2">⚠️ {error}</p>
            <button
              onClick={() => {
                setError(null);
                loadUnity();
              }}
              className="pixel-button-secondary w-full text-xs"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {/* Unity Warning Banner */}
      <div id="unity-warning" className="fixed bottom-5 left-1/2 -translate-x-1/2 max-w-2xl z-[3000]" />

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && isVisible && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded font-pixel z-[9999] space-y-1">
          <div>{isMobile ? '📱 Mobile Portrait' : '💻 Desktop Landscape'} - {dimensions.width}x{dimensions.height}</div>
          <div>🎫 NFT: {hasNFT ? 'PREMIUM ✅' : 'FREE'}</div>
          <div>📍 Build: {hasNFT ? '/nft' : '/v4'}</div>
          <div>👛 Wallet: {localStorage.getItem('walletAddress')?.slice(0, 10)}...</div>
        </div>
      )}
    </div>
  );
}