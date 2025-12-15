import React, { useEffect, useRef, useState } from 'react';
import CustomLoading from './CustomLoading';

let unityLoaderPromise = null;

export default function GameCanvas({ walletAddress, isVisible, onBack }) {
  const canvasRef = useRef(null);
  const unityInstanceRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMobile = window.innerWidth < 768;
  const dimensions = isMobile
    ? { width: 432, height: 768 }
    : { width: 900, height: 600 };

  const loadUnity = async () => {
    if (unityInstanceRef.current || !canvasRef.current) return;

    setLoading(true);
    setError(null);

    const BASE = 'https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/v3';
    const loaderUrl = `${BASE}/ZeroDash.loader.js`;

    const config = {
      dataUrl: `${BASE}/ZeroDash.data`,
      frameworkUrl: `${BASE}/ZeroDash.framework.js`,
      codeUrl: `${BASE}/ZeroDash.wasm`,
      streamingAssetsUrl: '/StreamingAssets',
      companyName: 'Kult Games',
      productName: 'Zero Dash',
      productVersion: '1.0',
      matchWebGLToCanvasSize: false,
      devicePixelRatio: 1,
    };

    try {
      if (!unityLoaderPromise) {
        unityLoaderPromise = new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = loaderUrl;
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      await unityLoaderPromise;

      requestAnimationFrame(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;

        const instance = await window.createUnityInstance(
          canvas,
          config,
          (p) => setProgress(Math.round(p * 100))
        );

        unityInstanceRef.current = instance;
        setLoading(false);

        if (walletAddress) {
          setTimeout(() => {
            try {
              instance.SendMessage('GameManager', 'SetWalletAddress', walletAddress);
            } catch {}
          }, 500);
        }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unity failed to load');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && !unityInstanceRef.current) loadUnity();
  }, [isVisible]);

  useEffect(() => {
    if (walletAddress && unityInstanceRef.current) {
      try {
        unityInstanceRef.current.SendMessage(
          'GameManager',
          'SetWalletAddress',
          walletAddress
        );
      } catch {}
    }
  }, [walletAddress]);

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {onBack && isVisible && !loading && (
        <button
          onClick={onBack}
          className="pixel-button-secondary fixed top-5 left-5 z-[9999]"
        >
          ⬅ BACK
        </button>
      )}

      <canvas
        ref={canvasRef}
        id="unity-canvas"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'block',
          margin: 'auto',
        }}
      />

      {loading && <CustomLoading progress={progress} isMobile={isMobile} />}

      {error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-900 border-4 border-red-500 p-4 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
