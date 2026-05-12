import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import bgmAudio from '../assets/zerodashbgm.mp3';

/**
 * Background Music Component
 * Plays Zero Dash BGM on loop
 * Stops when game starts
 * Includes collapsible mute/unmute control
 */
export default function BackgroundMusic({ isPlaying = true, onVolumeChange }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showControls, setShowControls] = useState(false);
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

    audio.volume = volume;
    audio.loop = true;

    if (isPlaying && hasInteracted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => console.log('🔇 Audio play blocked:', error.message));
      }
    }

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
      audio.play().catch((error) => console.log('Play failed:', error.message));
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (onVolumeChange) onVolumeChange(!isMuted ? 0 : volume);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    if (onVolumeChange) onVolumeChange(newVolume);
  };

  return (
    <>
      <audio ref={audioRef} src={bgmAudio} preload="auto" />

      <div 
        className={`fixed top-6 left-6 z-[9998] flex items-center gap-3
                    bg-zerion-blue-dark/80 backdrop-blur-md
                    border-2 border-zerion-yellow/50
                    rounded-lg px-3 py-2
                    shadow-xl
                    transition-all duration-300
                    hover:border-zerion-yellow
                    ${showControls ? 'w-auto opacity-100' : 'w-12 h-12 justify-center overflow-hidden cursor-pointer'}`}
        onClick={() => !showControls && setShowControls(true)}
      >
        <button
          onClick={(e) => {
            if (showControls) {
              e.stopPropagation();
              toggleMute();
            } else {
              setShowControls(true);
            }
          }}
          className="text-zerion-yellow hover:text-white transition-colors
                     flex items-center justify-center
                     w-8 h-8 rounded
                     hover:bg-zerion-blue/50"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {showControls && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-zerion-blue rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs font-pixel text-zerion-yellow min-w-[35px]">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <div className="text-xs font-pixel text-zerion-blue-light mr-1">BGM</div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowControls(false);
              }}
              className="text-zerion-yellow/60 hover:text-zerion-yellow text-[10px] font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}