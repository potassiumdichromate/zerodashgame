import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import bgmAudio from '../assets/zerodashbgm.mp3';

/**
 * Background Music Component
 * Plays Zero Dash BGM on loop
 * Stops when game starts
 * Includes mute/unmute control
 */
export default function BackgroundMusic({ isPlaying = true, onVolumeChange }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // 70% volume by default
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  /**
   * Handle first user interaction to enable audio
   */
  useEffect(() => {
    const enableAudio = () => {
      setHasInteracted(true);
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.play().catch(console.log);
      }
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, enableAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [isPlaying]);

  /**
   * Initialize audio on component mount
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial properties
    audio.volume = volume;
    audio.loop = true;

    // Try to play immediately (will work if user already interacted)
    if (isPlaying && hasInteracted) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎵 BGM started playing');
          })
          .catch((error) => {
            console.log('🔇 Waiting for user interaction:', error.message);
          });
      }
    }

    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [hasInteracted]);

  /**
   * Control playback based on isPlaying prop
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasInteracted) return;

    if (isPlaying && !isMuted) {
      audio.play().catch((error) => {
        console.log('Play failed:', error.message);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, hasInteracted]);

  /**
   * Handle volume changes
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (onVolumeChange) {
      onVolumeChange(!isMuted ? 0 : volume);
    }
  };

  /**
   * Handle volume slider change
   */
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={bgmAudio}
        preload="auto"
      />

      {/* Volume Control UI - Top Left Corner */}
      <div className="fixed top-6 left-6 z-[9998] flex items-center gap-3
                      bg-zerion-blue-dark/80 backdrop-blur-sm
                      border-2 border-zerion-yellow/50
                      rounded-lg px-4 py-3
                      shadow-xl
                      transition-all duration-300
                      hover:border-zerion-yellow">
        
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="text-zerion-yellow hover:text-white transition-colors
                     flex items-center justify-center
                     w-8 h-8 rounded
                     hover:bg-zerion-blue/50"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX size={20} />
          ) : (
            <Volume2 size={20} />
          )}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-zerion-blue rounded-lg appearance-none cursor-pointer
                       slider"
            aria-label="Volume"
          />
          <span className="text-xs font-pixel text-zerion-yellow min-w-[35px]">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* BGM Label */}
        <div className="text-xs font-pixel text-zerion-blue-light">
          BGM
        </div>
      </div>

      {/* Custom Slider Styling */}
      <style jsx>{`
        .slider {
          position: relative;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #f59e0b;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffd700;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
          margin-top: -6px; /* Centers the thumb */
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #ffd700;
          transform: scale(1.15);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #f59e0b;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffd700;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
        }
        
        .slider::-moz-range-thumb:hover {
          background: #ffd700;
          transform: scale(1.15);
        }

        .slider::-webkit-slider-runnable-track {
          background: linear-gradient(
            to right,
            #f59e0b 0%,
            #f59e0b ${volume * 100}%,
            #1a2d4d ${volume * 100}%,
            #1a2d4d 100%
          );
          height: 4px;
          border-radius: 2px;
        }
        
        .slider::-moz-range-track {
          background: #1a2d4d;
          height: 4px;
          border-radius: 2px;
        }
        
        .slider::-moz-range-progress {
          background: #f59e0b;
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}