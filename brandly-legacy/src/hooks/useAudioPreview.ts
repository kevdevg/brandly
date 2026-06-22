import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPreviewState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setSrc: (url: string) => void;
}

/**
 * Hook for previewing audio files in panels.
 * Manages a single HTML5 Audio element for lightweight playback.
 */
export function useAudioPreview(): AudioPreviewState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animFrameRef = useRef<number>(0);
  const currentSrcRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  const setSrc = useCallback((url: string) => {
    if (currentSrcRef.current === url) return;
    
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    currentSrcRef.current = url;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration ?? 0);
      });
    }

    audioRef.current.src = url;
    audioRef.current.load();
    setCurrentTime(0);
  }, []);

  const play = useCallback(() => {
    if (!audioRef.current || !currentSrcRef.current) return;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(updateTime);
    }).catch(console.warn);
  }, [updateTime]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    toggle,
    seek,
    setSrc,
  };
}
