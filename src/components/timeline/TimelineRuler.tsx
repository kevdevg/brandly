import React from 'react';

interface TimelineRulerProps {
  timeUnit: 'frames' | 'seconds';
  durationInFrames: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  timeUnit,
  durationInFrames,
  onPointerDown,
  onPointerMove,
  onPointerUp
}) => {
  return (
    <div 
      className="sticky top-0 h-6 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md z-10 cursor-pointer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="absolute top-0 left-0 w-full h-full flex justify-between text-[9px] text-neutral-500 px-1 items-end pb-1 font-mono pointer-events-none">
        <span>0{timeUnit === 'frames' ? 'f' : 's'}</span>
        <span>{timeUnit === 'frames' ? Math.round(durationInFrames * 0.25) : (durationInFrames * 0.25 / 30).toFixed(1)}{timeUnit === 'frames' ? 'f' : 's'}</span>
        <span>{timeUnit === 'frames' ? Math.round(durationInFrames * 0.5) : (durationInFrames * 0.5 / 30).toFixed(1)}{timeUnit === 'frames' ? 'f' : 's'}</span>
        <span>{timeUnit === 'frames' ? Math.round(durationInFrames * 0.75) : (durationInFrames * 0.75 / 30).toFixed(1)}{timeUnit === 'frames' ? 'f' : 's'}</span>
        <span>{timeUnit === 'frames' ? durationInFrames : (durationInFrames / 30).toFixed(1)}{timeUnit === 'frames' ? 'f' : 's'}</span>
      </div>
      {/* Ruler Ticks */}
      <div className="absolute bottom-0 left-0 w-full h-1 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px)', backgroundSize: `${100 / (durationInFrames / 15)}% 100%` }}></div>
    </div>
  );
};
