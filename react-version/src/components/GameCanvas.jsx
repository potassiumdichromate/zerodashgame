import React, { useEffect, useRef, useState } from 'react';
import CustomLoading from './CustomLoading';

/**
 * GameCanvas Component
 * Manages Unity WebGL instance loading and rendering
 * 
 * @param {Object} props
 * @param {string} props.walletAddress - Wallet address to pass to Unity
 * @param {boolean} props.isVisible - Canvas visibility state
 */
export default function GameCanvas({ walletAddress, isVisible }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const unityInstanceRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const R2_BASE_URL = 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/Latest';
    
    const buildUrl = R2_BASE_URL;
    const loaderUrl = `${buildUrl}/ZeroDash.loader.js`;
    
    const config = {
      arguments: [],
      dataUrl: `${buildUrl}/ZeroDash.data`,
      frameworkUrl: `${buildUrl}/ZeroDash.framework.js`,
      codeUrl: `${buildUrl}/ZeroDash.wasm`,
      streamingAssetsUrl: '/StreamingAssets', // Still local
      companyName: 'Kult Games',
      productName: 'Zero Dash',
      productVersion: '1.0',
      showBanner: unityShowBanner,
      matchWebGLToCanvasSize: false,
      devicePixelRatio: 1,
    };

      // Mobile viewport adjustment
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
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

          // Force canvas to maintain exact dimensions
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = 432;
            canvas.height = 768;
            canvas.style.width = '432px';
            canvas.style.height = '768px';
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
   * Load Unity when component becomes visible
   */
  useEffect(() => {
    if (isVisible && !unityInstanceRef.current && !isLoading) {
      loadUnity();
    }
  }, [isVisible]);

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
      style={{ width: '432px', height: '768px' }}
    >
      {/* Unity Canvas */}
      <canvas
        ref={canvasRef}
        id="unity-canvas"
        width="432"
        height="768"
        tabIndex="-1"
        className="border-4 border-zerion-yellow block"
        style={{ 
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
          width: '432px',
          height: '768px',
          imageRendering: 'pixelated'
        }}
      />

      {/* Custom Loading Screen */}
      {isLoading && <CustomLoading progress={loadingProgress} />}

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
    </div>
  );
}