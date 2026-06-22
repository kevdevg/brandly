import React, { useRef, useState, useCallback, RefObject } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { PlayerRef } from '@remotion/player';
import { TimelineElement } from '../../types';
import { TimelineRuler } from '../timeline/TimelineRuler';
import { TimelinePlayhead } from '../timeline/TimelinePlayhead';

interface ExpressTimelineProps {
  playerRef: RefObject<PlayerRef | null>;
  elements: TimelineElement[];
  durationInFrames: number;
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSeek: (frame: number) => void;
  duration: number;
}

/** Color + icon mapping for each element type */
const SLOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  text: { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300' },
  image: { bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300' },
  video: { bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300' },
  audio: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  sticker: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  shape: { bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/40', text: 'text-fuchsia-300' },
};

const SLOT_SELECTED: Record<string, { bg: string; border: string }> = {
  text: { bg: 'bg-violet-500/35', border: 'border-violet-500/70' },
  image: { bg: 'bg-sky-500/35', border: 'border-sky-500/70' },
  video: { bg: 'bg-sky-500/35', border: 'border-sky-500/70' },
  audio: { bg: 'bg-emerald-500/35', border: 'border-emerald-500/70' },
  sticker: { bg: 'bg-amber-500/35', border: 'border-amber-500/70' },
  shape: { bg: 'bg-fuchsia-500/35', border: 'border-fuchsia-500/70' },
};

/**
 * ExpressTimeline — Simplified timeline for Express editor.
 * Reuses TimelineRuler and TimelinePlayhead from the Pro editor.
 * Shows element bars as simple colored blocks, no resize/reorder.
 */
export const ExpressTimeline: React.FC<ExpressTimelineProps> = ({
  playerRef,
  elements,
  durationInFrames,
  selectedSlotId,
  onSelectSlot,
  isPlaying,
  onPlayToggle,
  onSeek,
  duration,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const seekFromPointer = useCallback((clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const frame = Math.round(ratio * durationInFrames);
    onSeek(frame);
  }, [durationInFrames, onSeek]);

  const handleRulerPointerDown = useCallback((e: React.PointerEvent) => {
    seekFromPointer(e.clientX);
  }, [seekFromPointer]);

  const handleRulerPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 1) seekFromPointer(e.clientX);
  }, [seekFromPointer]);

  const handlePlayheadPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePlayheadPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingPlayhead) return;
    seekFromPointer(e.clientX);
  }, [isDraggingPlayhead, seekFromPointer]);

  const handlePlayheadPointerUp = useCallback(() => {
    setIsDraggingPlayhead(false);
  }, []);

  // Filter out brand elements (intro/outro) from display — they show as amber accent
  const contentElements = elements.filter(el => !el.isBrandElement);
  const brandElements = elements.filter(el => el.isBrandElement);

  return (
    <div className="bg-neutral-900/80 border-t border-neutral-800/60 shrink-0">
      {/* ── Mini Controls ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-800/40">
        <button
          onClick={onPlayToggle}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
          className="w-6 h-6 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shadow-sm"
        >
          {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
        </button>
        <button
          onClick={() => onSeek(0)}
          title="Reiniciar"
          className="w-5 h-5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center transition-colors"
        >
          <RotateCcw size={9} />
        </button>
        <span className="text-[9px] text-neutral-500 font-mono">{duration}s · {durationInFrames}f</span>
        <div className="flex-1" />
        {elements.some(el => el.type === 'audio') && (
          <Volume2 size={12} className="text-emerald-400 opacity-60" />
        )}
      </div>

      {/* ── Ruler + Tracks ── */}
      <div ref={timelineRef} className="relative">
        {/* Ruler (REUSED) */}
        <TimelineRuler
          timeUnit="seconds"
          durationInFrames={durationInFrames}
          onPointerDown={handleRulerPointerDown}
          onPointerMove={handleRulerPointerMove}
          onPointerUp={() => {}}
        />

        {/* Track bars */}
        <div className="relative px-1 py-1 space-y-0.5 min-h-[40px]">
          {/* Brand elements (intro/outro) — subtle amber */}
          {brandElements.map(el => {
            const left = (el.startFrame / durationInFrames) * 100;
            const width = ((el.endFrame - el.startFrame) / durationInFrames) * 100;
            return (
              <div
                key={el.id}
                className="h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center px-1.5 overflow-hidden"
                style={{ marginLeft: `${left}%`, width: `${width}%` }}
                title={el.startFrame === 0 ? 'Intro de marca' : 'Outro de marca'}
              >
                <span className="text-[7px] text-amber-400 font-medium truncate">
                  {el.startFrame === 0 ? '🎬 Intro' : '🎬 Outro'}
                </span>
              </div>
            );
          })}

          {/* Content elements — colored by type */}
          {contentElements.map(el => {
            const left = (el.startFrame / durationInFrames) * 100;
            const width = Math.max(2, ((el.endFrame - el.startFrame) / durationInFrames) * 100);
            const colors = SLOT_COLORS[el.type] || SLOT_COLORS.text;
            const isSelected = selectedSlotId === el.id;
            const selectedColors = SLOT_SELECTED[el.type] || SLOT_SELECTED.text;

            return (
              <button
                key={el.id}
                onClick={() => onSelectSlot(el.id)}
                title={el.elementName || el.content?.substring(0, 30) || el.type}
                className={`h-5 rounded-md border flex items-center px-1.5 overflow-hidden cursor-pointer transition-all hover:brightness-125 ${
                  isSelected
                    ? `${selectedColors.bg} ${selectedColors.border} ring-1 ring-white/10`
                    : `${colors.bg} ${colors.border}`
                }`}
                style={{ marginLeft: `${left}%`, width: `${width}%` }}
              >
                <span className={`text-[7px] font-medium truncate ${colors.text}`}>
                  {el.elementName || el.content?.substring(0, 25) || el.type}
                </span>
              </button>
            );
          })}
        </div>

        {/* Playhead (REUSED) */}
        <TimelinePlayhead
          playerRef={playerRef}
          durationInFrames={durationInFrames}
          onPointerDown={handlePlayheadPointerDown}
          onPointerMove={handlePlayheadPointerMove}
          onPointerUp={handlePlayheadPointerUp}
          isDraggingPlayhead={isDraggingPlayhead}
        />
      </div>
    </div>
  );
};
