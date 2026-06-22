import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Film } from 'lucide-react';
import { Player, PlayerRef } from '@remotion/player';
import { ExpressTemplate, CompanyProfile, DesignMD } from '../../types';
import { BrandComposition } from '../BrandComposition';
import { compileExpressToTimeline, getAspectDimensions, getTemplateDuration } from '../../utils/expressCompiler';

/**
 * LivePreviewCanvas — Shared Remotion preview component.
 *
 * Compiles TemplateField[] + fieldData → TimelineElement[] → Remotion Player.
 *
 * Used in:
 * - ProductionForm (production preview)
 * - TemplateBuilder test-data mode (design-time preview)
 */

export interface LivePreviewCanvasProps {
  template: ExpressTemplate;
  fieldData: Record<string, string>;
  brand: CompanyProfile;
  designMD: DesignMD;
  /** Override objectFit per field ID */
  mediaFits?: Record<string, 'cover' | 'contain' | 'fill'>;
  /** Override containBgColor per field ID */
  containBgColors?: Record<string, string | null>;
  /** Show playback controls (play/pause/reset) — default true for video */
  showControls?: boolean;
  /** Active scene ID for scene navigation */
  activeSceneId?: string | null;
  /** Callback when user navigates to a scene */
  onSceneChange?: (sceneId: string) => void;
  /** External player ref */
  playerRef?: React.RefObject<PlayerRef>;
  /** Status label (e.g. "Listo" / "Faltan campos") */
  statusLabel?: string;
  /** Whether all required fields are complete */
  isComplete?: boolean;
}

/** Format frame number to mm:ss */
function formatTime(frames: number, fps: number): string {
  const secs = Math.floor(frames / fps);
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}:${String(remainSecs).padStart(2, '0')}`;
}

/** Scene type colors for timeline segments */
const SCENE_COLORS: Record<string, string> = {
  intro: '#10b981',
  content: '#8b5cf6',
  outro: '#f43f5e',
};

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  template,
  fieldData,
  brand,
  designMD,
  mediaFits = {},
  containBgColors = {},
  showControls,
  activeSceneId,
  onSceneChange,
  playerRef: externalRef,
  statusLabel,
  isComplete = false,
}) => {
  const internalRef = useRef<PlayerRef>(null);
  const playerRef = externalRef || internalRef;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const scrubRef = useRef<HTMLDivElement>(null);
  const isScrubbing = useRef(false);

  const fps = 30;
  const totalDuration = getTemplateDuration(template);
  const totalFrames = Math.max(30, totalDuration * fps);
  const dimensions = getAspectDimensions(template.aspectRatio);

  // Compile template to timeline (reactive to fieldData + mediaFits)
  const compiled = useMemo(() => {
    const result = compileExpressToTimeline(template, fieldData, designMD, brand);
    // Strip transitions and apply mediaFit overrides
    result.elements = result.elements.map(el => {
      const fieldId = el.sourceFieldId;
      const fitOverride = fieldId ? mediaFits[fieldId] : undefined;
      const bgOverride = fieldId ? containBgColors[fieldId] : undefined;
      return {
        ...el,
        transitionIn: undefined,
        transitionOut: undefined,
        ...(fitOverride ? { objectFit: fitOverride } : {}),
        ...(bgOverride !== undefined ? { containBgColor: bgOverride } : {}),
      };
    });
    return result;
  }, [template, fieldData, designMD, brand, mediaFits, containBgColors]);

  const playerInputProps = useMemo(() => ({
    designMD,
    timelineElements: compiled.elements,
    layers: compiled.layers,
    selectedElementId: null,
    textOverlay: '',
    brandVisibility: {
      logo: false,
      frame: false,
      background: true,
    },
    outputFormat: template.format,
  }), [designMD, compiled, template.format]);

  // Force Player remount when media sources change (blob URLs from uploads).
  // Remotion's Player doesn't always re-render paused compositions on inputProps change.
  const playerKey = useMemo(() => {
    return compiled.elements
      .filter(el => el.type === 'video' || el.type === 'image')
      .map(el => el.content || '')
      .join('|');
  }, [compiled]);

  const shouldShowControls = showControls ?? (template.format === 'video');
  const isMultiScene = template.scenes.length > 1;

  // ── Frame tracking via polling ──
  useEffect(() => {
    if (!shouldShowControls) return;
    const interval = setInterval(() => {
      if (playerRef.current && !isScrubbing.current) {
        const frame = playerRef.current.getCurrentFrame();
        setCurrentFrame(frame);
      }
    }, 1000 / 15); // 15Hz polling is enough for UI update
    return () => clearInterval(interval);
  }, [playerRef, shouldShowControls]);

  // ── Scene segments for timeline ──
  const sceneSegments = useMemo(() => {
    let offset = 0;
    return template.scenes.map(scene => {
      const durFrames = scene.durationSeconds * fps;
      const seg = {
        id: scene.id,
        name: scene.type === 'intro' ? 'INTRO' : scene.type === 'outro' ? 'OUTRO' : scene.name,
        type: scene.type || 'content',
        startFrame: offset,
        endFrame: offset + durFrames,
        widthPct: (durFrames / totalFrames) * 100,
      };
      offset += durFrames;
      return seg;
    });
  }, [template, fps, totalFrames]);

  const handlePlayToggle = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, playerRef]);

  const handleSelectScene = useCallback((sceneId: string) => {
    if (!playerRef.current) return;
    let frameOffset = 0;
    for (const scene of template.scenes) {
      if (scene.id === sceneId) break;
      frameOffset += scene.durationSeconds * fps;
    }
    playerRef.current.seekTo(frameOffset);
    playerRef.current.pause();
    setIsPlaying(false);
    onSceneChange?.(sceneId);
  }, [template, fps, playerRef, onSceneChange]);

  // ── Scrub bar interactions ──
  const scrubToPosition = useCallback((clientX: number) => {
    if (!scrubRef.current || !playerRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const frame = Math.round(pct * (totalFrames - 1));
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
  }, [playerRef, totalFrames]);

  const handleScrubDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isScrubbing.current = true;
    playerRef.current?.pause();
    setIsPlaying(false);
    scrubToPosition(e.clientX);
  }, [playerRef, scrubToPosition]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!isScrubbing.current) return;
    scrubToPosition(e.clientX);
  }, [scrubToPosition]);

  const handleScrubUp = useCallback(() => {
    isScrubbing.current = false;
  }, []);

  const playheadPct = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  // Determine which scene the playhead is currently in
  const activeSceneFromPlayhead = useMemo(() => {
    for (const seg of sceneSegments) {
      if (currentFrame >= seg.startFrame && currentFrame < seg.endFrame) return seg.id;
    }
    return sceneSegments[sceneSegments.length - 1]?.id;
  }, [currentFrame, sceneSegments]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-hidden">
      {/* Status header */}
      {statusLabel !== undefined && (
        <div className="absolute top-4 left-5 flex items-center gap-2 z-20">
          <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-xs font-semibold text-neutral-300">Preview en vivo</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
            isComplete
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            {statusLabel}
          </span>
        </div>
      )}

      {/* Player container */}
      <div
        className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-neutral-800/40"
        style={{
          width: template.aspectRatio === '9:16' ? 240
            : template.aspectRatio === '1:1' ? 320
            : template.aspectRatio === '4:5' ? 280
            : 420,
          aspectRatio: `${dimensions.w} / ${dimensions.h}`,
          maxHeight: 'calc(100% - 160px)',
        }}
      >
        <Player
          key={playerKey}
          ref={playerRef}
          component={BrandComposition}
          inputProps={playerInputProps}
          durationInFrames={totalFrames}
          compositionWidth={dimensions.w}
          compositionHeight={dimensions.h}
          fps={fps}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          autoPlay={false}
          loop
        />
      </div>

      {/* ═══ Timeline Controls ═══ */}
      {shouldShowControls && (
        <div className="mt-4 w-full max-w-md px-4 z-10 space-y-2">
          {/* ── Scrub Bar with scene segments ── */}
          <div
            ref={scrubRef}
            className="relative h-7 cursor-col-resize group rounded-lg overflow-hidden"
            onPointerDown={handleScrubDown}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubUp}
            onPointerCancel={handleScrubUp}
            title="Arrastra para navegar"
          >
            {/* Scene segment blocks */}
            <div className="absolute inset-0 flex gap-px rounded-lg overflow-hidden">
              {sceneSegments.map(seg => {
                const isActive = activeSceneFromPlayhead === seg.id;
                const color = SCENE_COLORS[seg.type] || SCENE_COLORS.content;
                return (
                  <div
                    key={seg.id}
                    className="relative h-full flex items-center justify-center transition-all"
                    style={{
                      width: `${seg.widthPct}%`,
                      backgroundColor: isActive ? `${color}25` : `${color}10`,
                      borderBottom: `2px solid ${isActive ? color : `${color}40`}`,
                    }}
                  >
                    <span
                      className="text-[7px] font-bold tracking-wider truncate px-1 pointer-events-none select-none"
                      style={{ color: isActive ? color : `${color}80` }}
                    >
                      {seg.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full pointer-events-none transition-[width] duration-75"
              style={{
                width: `${playheadPct}%`,
                background: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
              }}
            />

            {/* Playhead line */}
            <div
              className="absolute top-0 h-full w-0.5 pointer-events-none transition-[left] duration-75 z-10"
              style={{
                left: `${playheadPct}%`,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 0 4px rgba(139,92,246,0.6)',
              }}
            />

            {/* Playhead thumb (appears on hover / scrub) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg shadow-violet-500/30 border-2 border-violet-500 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ left: `${playheadPct}%` }}
            />
          </div>

          {/* ── Controls row ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayToggle}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
              className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shadow-md"
            >
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
            <button
              onClick={() => { playerRef.current?.seekTo(0); setCurrentFrame(0); setIsPlaying(false); playerRef.current?.pause(); }}
              title="Reiniciar"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center transition-colors"
            >
              <RotateCcw size={10} />
            </button>

            {/* Time display */}
            <span className="text-[10px] font-mono text-neutral-400 ml-1">
              {formatTime(currentFrame, fps)}
              <span className="text-neutral-600 mx-0.5">/</span>
              {formatTime(totalFrames, fps)}
            </span>

            <div className="flex-1" />

            {/* Scene navigation buttons */}
            {isMultiScene && (
              <div className="flex items-center gap-0.5">
                {template.scenes.map(scene => {
                  const color = SCENE_COLORS[scene.type || 'content'] || SCENE_COLORS.content;
                  const isActive = activeSceneFromPlayhead === scene.id;
                  const label = scene.type === 'intro' ? 'IN'
                    : scene.type === 'outro' ? 'OUT'
                    : scene.name.slice(0, 4);
                  return (
                    <button
                      key={scene.id}
                      onClick={() => handleSelectScene(scene.id)}
                      title={`${scene.type === 'intro' ? 'Intro' : scene.type === 'outro' ? 'Outro' : scene.name} — ${scene.durationSeconds}s`}
                      className="px-2 py-0.5 rounded text-[7px] font-bold border transition-all uppercase tracking-wider"
                      style={{
                        borderColor: isActive ? `${color}80` : 'rgba(64,64,64,0.5)',
                        backgroundColor: isActive ? `${color}15` : 'transparent',
                        color: isActive ? color : 'rgb(115,115,115)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="absolute bottom-4 text-[10px] text-neutral-600 z-10">
        Se actualiza al llenar los campos
      </p>
    </div>
  );
};

