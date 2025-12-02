import React, { useEffect, useRef, useState } from 'react';
import CustomLoading from './CustomLoading';

/**
 * GameCanvas Component - RESPONSIVE VERSION
 * Manages Unity WebGL instance loading and rendering
 * Adapts to desktop (900x600) and mobile (432x768) devices
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

  /**
   * Detect device type and set appropriate dimensions
   */
  useEffect(() => {
    const checkDevice = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // Mobile: Portrait mode
        setDimensions({ width: 432, height: 768 });
      } else {
        // Desktop: Landscape mode
        setDimensions({ width: 900, height: 600 });
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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
      // 🔥 POINT TO R2 BUCKET
      const R2_BASE_URL = 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/v3';
      
      const buildUrl = R2_BASE_URL;
      const loaderUrl = `${buildUrl}/ZeroDash.loader.js`;
      
      const config = {
        arguments: [],
        dataUrl: `${buildUrl}/ZeroDash.data`,
        frameworkUrl: `${buildUrl}/ZeroDash.framework.js`,
        codeUrl: `${buildUrl}/ZeroDash.wasm`,
        streamingAssetsUrl: '/StreamingAssets',
        companyName: 'Kult Games',
        productName: 'Zero Dash',
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

          // Send wallet address to Unity after a short delay
          if (walletAddress) {
            setTimeout(() => {
              try {
                unityInstance.SendMessage('GameManager', 'SetWalletAddress', walletAddress);
                console.log('✅ Wallet address sent to Unity:', walletAddress);
              } catch (err) {
                console.warn('⚠️ Could not send wallet address to Unity:', err);
              }
            }, 1000);
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
   * Load Unity when component becomes visible
   */
  useEffect(() => {
    if (isVisible && !unityInstanceRef.current && !isLoading) {
      loadUnity();
    }
  }, [isVisible, dimensions]);

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
      {onBack && isVisible && !isLoading && (
        <button
          onClick={onBack}
          className="absolute -top-16 left-0 pixel-button-secondary text-xs px-6 py-2 z-10"
          style={{
            fontSize: '10px',
            padding: '8px 16px',
            border: '3px solid #3b82f6'
          }}
        >
          ← BACK TO MENU
        </button>
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
          imageRendering: isMobile ? 'pixelated' : 'auto'
        }}
      />

      {/* Custom Loading Screen */}
      {isLoading && <CustomLoading progress={loadingProgress} isMobile={isMobile} />}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-5 max-w-md">
          <div className="bg-red-900/90 border-4 border-red-500 p-4 text-xs animate-shake">
            {error}
          </div>
        </div>
      )}

      {/* Unity Warning Banner */}
      <div id="unity-warning" className="fixed bottom-5 left-1/2 -translate-x-1/2 max-w-2xl z-[3000]" />

      {/* Device indicator (debug) - BOTTOM LEFT, TEXT ONLY */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded font-pixel z-[9999]">
          {isMobile ? '📱 Mobile' : '💻 Desktop'}
        </div>
      )}
    </div>
  );
}
