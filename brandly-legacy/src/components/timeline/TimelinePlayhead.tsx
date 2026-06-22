import React, { useEffect, useRef, RefObject } from 'react';
import { PlayerRef } from '@remotion/player';

interface TimelinePlayheadProps {
  playerRef: RefObject<PlayerRef | null>;
  durationInFrames: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  isDraggingPlayhead: boolean;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
  playerRef,
  durationInFrames,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  isDraggingPlayhead
}) => {
  const playheadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const updatePlayhead = () => {
      if (playerRef.current && playheadRef.current && durationInFrames > 0) {
        const frame = playerRef.current?.getCurrentFrame() || 0;
        const percentage = (frame / durationInFrames) * 100;
        playheadRef.current.style.left = `${percentage}%`;
      }
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [durationInFrames, playerRef]);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-px bg-red-500 z-30 drop-shadow-[0_0_2px_rgba(239,68,68,0.8)] flex-col items-center pointer-events-none"
      style={{ left: '0%' }}
    >
      <div 
        className="w-2.5 h-2.5 bg-red-500 rounded-sm -ml-[5px] -mt-0 shadow-[0_0_4px_rgba(239,68,68,0.8)] before:absolute before:w-0 before:h-0 before:border-l-[5px] before:border-r-[5px] before:border-t-[5px] before:border-l-transparent before:border-r-transparent before:border-t-red-500 before:top-2.5 before:left-[-5px] pointer-events-auto cursor-ew-resize"
        onPointerDown={onPointerDown}
        onPointerMove={isDraggingPlayhead ? onPointerMove : undefined}
        onPointerUp={isDraggingPlayhead ? onPointerUp : undefined}
      ></div>
    </div>
  );
};
