import React, { useState, useEffect, useRef } from 'react';
import { PlayerRef } from '@remotion/player';

interface PlaybackInfoProps {
  playerRef: React.RefObject<PlayerRef | null>;
  durationInFrames: number;
  fps?: number;
  elementCount?: number;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2] as const;

/**
 * PlaybackInfo — Shows current time/frame, total duration, progress bar, and preview speed control.
 * Auto-updates while playing via requestAnimationFrame.
 */
export const PlaybackInfo: React.FC<PlaybackInfoProps> = ({
  playerRef,
  durationInFrames,
  fps = 30,
  elementCount,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef<number>();

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const updateFrame = () => {
      try {
        setCurrentFrame(player.getCurrentFrame());
        setIsPlaying(player.isPlaying());
      } catch {}
      rafRef.current = requestAnimationFrame(updateFrame);
    };
    
    rafRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerRef]);

  const handleSpeedCycle = () => {
    const currentIdx = SPEED_OPTIONS.indexOf(speed as (typeof SPEED_OPTIONS)[number]);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIdx];
    setSpeed(newSpeed);
    window.dispatchEvent(new CustomEvent('preview-speed-change', { detail: newSpeed }));
  };

  const currentTime = (currentFrame / fps).toFixed(1);
  const totalTime = (durationInFrames / fps).toFixed(1);
  const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-neutral-950/70 backdrop-blur-sm border border-neutral-800/40 rounded-lg px-2.5 py-1 shadow-lg">
      {/* Mini progress bar */}
      <div className="w-12 h-1 bg-neutral-800 rounded-full overflow-hidden" title={`${progress.toFixed(0)}%`}>
        <div 
          className="h-full bg-violet-500 transition-all duration-75 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`} />
        <span className="text-[10px] font-mono text-neutral-300">
          {currentTime}s
        </span>
        <span className="text-[10px] font-mono text-neutral-600">/</span>
        <span className="text-[10px] font-mono text-neutral-500">
          {totalTime}s
        </span>
      </div>
      <span className="text-[9px] font-mono text-neutral-600">
        F{currentFrame}
      </span>
      {/* Speed button */}
      <button
        onClick={handleSpeedCycle}
        title="Cambiar velocidad de preview (clic para ciclar)"
        className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
          speed !== 1
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'text-neutral-600 hover:text-neutral-400 border border-transparent'
        }`}
      >
        {speed}x
      </button>
      {elementCount !== undefined && (
        <span className="text-[9px] font-mono text-neutral-600" title="Elementos en composición">
          | {elementCount} el
        </span>
      )}
    </div>
  );
};
