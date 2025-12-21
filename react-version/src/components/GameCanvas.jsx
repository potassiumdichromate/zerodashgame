import React, { useEffect, useRef, useState } from 'react';
import CustomLoading from './CustomLoading';

const BACKEND_URL = 'https://zerodashbackend.onrender.com';

/**
 * GameCanvas Component - NFT-AWARE VERSION (MOBILE PORTRAIT OPTIMIZED)
 * Manages Unity WebGL instance loading and rendering
 * Loads different game builds based on NFT ownership
 * Passes wallet address via URL parameter to Unity
 * LOCKED TO PORTRAIT MODE ON MOBILE - NO ROTATION
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
   * Detect device type and set PORTRAIT dimensions
   * Mobile: Always portrait, no rotation
   * Desktop: Landscape as usual
   */
  useEffect(() => {
    const checkDevice = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // 🔥 MOBILE: PORTRAIT MODE ONLY
        // Calculate optimal portrait dimensions for mobile
        const maxWidth = Math.min(window.innerWidth - 40, 540); // Max 540px width with padding
        const maxHeight = window.innerHeight - 120; // Leave space for buttons
        
        // Portrait aspect ratio (9:16)
        const portraitWidth = maxWidth;
        const portraitHeight = Math.min(maxHeight, portraitWidth * (16 / 9));
        
        setDimensions({ 
          width: Math.floor(portraitWidth), 
          height: Math.floor(portraitHeight) 
        });
        
        console.log('📱 Mobile Portrait Mode:', { width: portraitWidth, height: portraitHeight });
      } else {
        // 💻 DESKTOP: LANDSCAPE MODE
        const maxWidth = Math.min(window.innerWidth - 100, 1200);
        const maxHeight = window.innerHeight - 150;
        
        // Landscape aspect ratio (16:9)
        const landscapeWidth = maxWidth;
        const landscapeHeight = Math.min(maxHeight, landscapeWidth * (9 / 16));
        
        setDimensions({ 
          width: Math.floor(landscapeWidth), 
          height: Math.floor(landscapeHeight) 
        });
        
        console.log('💻 Desktop Landscape Mode:', { width: landscapeWidth, height: landscapeHeight });
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
    if (!isMobile) return;

    const lockOrientation = async () => {
      try {
        // Try Screen Orientation API
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('portrait');
          console.log('✅ Screen locked to portrait mode');
        }
      } catch (err) {
        console.log('ℹ️ Screen orientation lock not supported:', err.message);
      }
    };

    lockOrientation();

    // Cleanup: unlock on unmount
    return () => {
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (err) {
          console.log('Could not unlock orientation:', err);
        }
      }
    };
  }, [isMobile]);

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
        : 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/v5';   // Free players get standard build
      
      console.log(`🎮 Loading ${hasNFT ? 'PREMIUM' : 'FREE'} game build from:`, BASE_URL);
      
      // Add wallet address as URL parameter
      const walletParam = storedWalletAddress ? `?wallet=${encodeURIComponent(storedWalletAddress)}` : '';
      const buildUrlWithWallet = `${BASE_URL}${walletParam}`;
      
      console.log('📍 Build URL with wallet:', buildUrlWithWallet);
      
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

      // 🔥 MOBILE: PORTRAIT VIEWPORT (NO ROTATION)
      if (isMobile) {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        // Lock viewport to portrait, disable zoom, prevent rotation
        meta.content = 'width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=yes';
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
                // Method 1: Direct SendMessage to Unity
                unityInstance.SendMessage('GameManager', 'SetWalletAddress', storedWalletAddress);
                console.log('✅ Wallet address sent to Unity via SendMessage:', storedWalletAddress);
                
                // Method 2: Also set as global variable (if Unity needs it)
                window.playerWalletAddress = storedWalletAddress;
                console.log('✅ Wallet address set as window.playerWalletAddress:', storedWalletAddress);
                
                // Method 3: Store in Unity PlayerPrefs equivalent
                try {
                  unityInstance.SendMessage('GameManager', 'SaveWalletAddress', storedWalletAddress);
                  console.log('✅ Wallet address saved in Unity PlayerPrefs');
                } catch (err) {
                  console.log('ℹ️ SaveWalletAddress method not available (optional)');
                }
                
              } catch (err) {
                console.warn('⚠️ Could not send wallet address to Unity:', err);
              }
            }, 1500); // Wait 1.5s for Unity to fully initialize
          } else {
            console.warn('⚠️ No wallet address found in localStorage');
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
   * Reload Unity when dimensions change (device orientation/resize)
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
      className={`fixed inset-0 z-[500] flex items-center justify-center
                  transition-opacity duration-500
                  ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                  ${isMobile ? 'p-4' : 'p-8'}`}
    >
      {/* Game Container */}
      <div className="relative flex flex-col items-center gap-4 w-full h-full justify-center">
        
        {/* Top Bar: Back Button & NFT Badge */}
        {isVisible && !isLoading && !checkingNFT && (
          <div className="flex items-center justify-between w-full max-w-[540px] px-2">
            {/* Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="pixel-button-secondary text-xs px-4 py-2"
                style={{
                  fontSize: isMobile ? '8px' : '10px',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  border: '3px solid #3b82f6'
                }}
              >
                ← BACK
              </button>
            )}

            {/* NFT Status Badge */}
            <div className={`
              px-3 py-1.5 rounded-lg border-3 font-pixel text-xs font-bold
              ${hasNFT 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 text-white' 
                : 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500 text-gray-200'
              }
            `}
            style={{ fontSize: isMobile ? '8px' : '10px' }}
            >
              {hasNFT ? '🎫 PREMIUM' : '🎮 FREE'}
            </div>
          </div>
        )}

        {/* Unity Canvas Container */}
        <div 
          className="relative flex-shrink-0"
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
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
              width: '100%',
              height: '100%',
              imageRendering: isMobile ? 'pixelated' : 'auto',
              touchAction: 'none', // Prevent mobile browser gestures
            }}
          />

          {/* NFT Checking Screen */}
          {checkingNFT && isVisible && (
            <div className="absolute inset-0 bg-zerion-blue-dark/95 border-4 border-zerion-yellow flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 border-4 border-zerion-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-base md:text-lg font-pixel text-zerion-yellow font-bold mb-2">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
              <div className="bg-red-900/90 border-4 border-red-500 p-4 text-xs max-w-sm animate-shake">
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
        </div>
      </div>

      {/* Unity Warning Banner */}
      <div id="unity-warning" className="fixed bottom-5 left-1/2 -translate-x-1/2 max-w-2xl z-[3000]" />

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && isVisible && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-[8px] md:text-xs px-2 md:px-3 py-1 md:py-2 rounded font-pixel z-[9999] space-y-1">
          <div>{isMobile ? '📱 Mobile' : '💻 Desktop'} - {dimensions.width}x{dimensions.height}</div>
          <div>🎫 NFT: {hasNFT ? 'PREMIUM ✅' : 'FREE'}</div>
          <div>📍 Build: {hasNFT ? '/nft' : '/v4'}</div>
          <div>👛 Wallet: {localStorage.getItem('walletAddress')?.slice(0, 10)}...</div>
          <div>🔒 Orientation: {isMobile ? 'Portrait Locked' : 'Landscape'}</div>
        </div>
      )}

      {/* Rotation Warning for Mobile (if user tries to rotate) */}
      {isMobile && (
        <style jsx>{`
          @media screen and (orientation: landscape) and (max-width: 768px) {
            body::after {
              content: '📱 Please rotate your device to portrait mode';
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(0, 0, 0, 0.95);
              color: white;
              padding: 2rem;
              border-radius: 1rem;
              font-family: 'Press Start 2P', monospace;
              font-size: 0.8rem;
              text-align: center;
              z-index: 99999;
              border: 4px solid #f59e0b;
            }
          }
        `}</style>
      )}
    </div>
  );
}