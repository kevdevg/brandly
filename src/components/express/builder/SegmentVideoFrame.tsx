import React, { useRef, useCallback, useMemo } from 'react';
import { Move, Maximize2, Film, AlertTriangle, FileText } from 'lucide-react';
import { ExpressScene, DesignMD, CompanyProfile } from '../../../types';
import { getAspectDimensions } from '../../../utils/expressCompiler';
import { useDragResize } from '../../../hooks/useDragResize';

const SEGMENT_VIDEO_ID = 'segment-video-frame';

interface SegmentVideoFrameProps {
  scene: ExpressScene;
  designMD: DesignMD;
  previewBrand: CompanyProfile | null;
  aspectRatio: string;
  onPositionChange: (updates: Partial<ExpressScene>) => void;
}

/**
 * SegmentVideoFrame — Draggable/resizable video element for intro/outro segments.
 *
 * Rendered on the BuilderCanvas when the active scene is a segment (intro/outro).
 * Uses the shared `useDragResize` hook per AGENTS.md rules.
 * Shows the brand video thumbnail or a placeholder depending on source and availability.
 */
export const SegmentVideoFrame: React.FC<SegmentVideoFrameProps> = ({
  scene,
  designMD,
  previewBrand,
  aspectRatio,
  onPositionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isIntro = scene.type === 'intro';
  const isBrand = scene.segmentSource === 'brand';

  // Current position (defaults to fullscreen centered)
  const x = scene.segmentVideoX ?? 50;
  const y = scene.segmentVideoY ?? 50;
  const w = scene.segmentVideoW ?? 100;
  const h = scene.segmentVideoH ?? 100;
  const fit = scene.segmentVideoFit ?? (isBrand
    ? (isIntro ? (designMD.introVideoFit || 'cover') : (designMD.outroVideoFit || 'cover'))
    : 'cover');

  // Brand video URL
  const videoUrl = isBrand
    ? (isIntro ? designMD.introVideoUrl : designMD.outroVideoUrl)
    : undefined;
  const hasVideo = !!videoUrl;

  const dimensions = getAspectDimensions(aspectRatio);

  // ── Drag/resize hook ──
  const {
    startDrag,
    startResize,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    snapGuides,
  } = useDragResize({
    containerRef: containerRef as React.RefObject<HTMLElement>,
    onMove: useCallback((_id: string, newX: number, newY: number) => {
      onPositionChange({ segmentVideoX: newX, segmentVideoY: newY });
    }, [onPositionChange]),
    onResize: useCallback((_id: string, newW: number, newH: number) => {
      onPositionChange({ segmentVideoW: newW, segmentVideoH: newH });
    }, [onPositionChange]),
    snapLines: [50],
    snapThreshold: 1.5,
  });

  // Object-fit toggle
  const fitOptions: Array<{ value: 'cover' | 'contain' | 'fill'; label: string }> = [
    { value: 'cover', label: 'Cover' },
    { value: 'contain', label: 'Contain' },
    { value: 'fill', label: 'Fill' },
  ];

  // Background color based on scene type
  const bgColor = useMemo(() => {
    const bg = scene.background;
    if (!bg) return designMD.secondaryColor;
    switch (bg.type) {
      case 'brand': return designMD.secondaryColor;
      case 'solid': return bg.value || '#1a1a1a';
      default: return designMD.secondaryColor;
    }
  }, [scene.background, designMD]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-4 overflow-hidden relative min-h-0">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}
      />

      {/* Mode indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <Film size={12} className="text-emerald-400" />
        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
          {isIntro ? 'Posición — Intro' : 'Posición — Outro'}
        </span>
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
          isBrand ? 'bg-violet-500/15 text-violet-300' : 'bg-sky-500/15 text-sky-300'
        }`}>
          {isBrand ? '⚡ Marca' : '📋 Formulario'}
        </span>
      </div>

      {/* Canvas wrapper */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-neutral-800/40 select-none shrink-0"
        style={{
          ...(aspectRatio === '9:16' || aspectRatio === '4:5'
            ? { height: 'calc(100% - 80px)', maxWidth: '90%' }
            : {
                width: aspectRatio === '1:1' ? 360 : 440,
                maxHeight: 'calc(100% - 80px)',
              }),
          aspectRatio: `${dimensions.w} / ${dimensions.h}`,
          backgroundColor: bgColor,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Center crosshair (subtle) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.03] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.03] pointer-events-none z-0" />

        {/* Snap guides */}
        {snapGuides.x !== undefined && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-50"
            style={{ left: `${snapGuides.x}%`, width: '1px', background: 'rgba(16, 185, 129, 0.5)', borderLeft: '1px dashed rgba(16, 185, 129, 0.6)' }}
          />
        )}
        {snapGuides.y !== undefined && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-50"
            style={{ top: `${snapGuides.y}%`, height: '1px', background: 'rgba(16, 185, 129, 0.5)', borderTop: '1px dashed rgba(16, 185, 129, 0.6)' }}
          />
        )}

        {/* ── Video Frame Element ── */}
        <div
          className="absolute transition-shadow"
          style={{
            left: `${x - w / 2}%`,
            top: `${y - h / 2}%`,
            width: `${w}%`,
            height: `${h}%`,
            zIndex: 10,
          }}
        >
          <div
            className={`w-full h-full rounded-md flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
              isDragging ? 'scale-[1.01] shadow-xl' : ''
            }`}
            style={{
              border: '2px solid rgba(16, 185, 129, 0.6)',
              outline: '2px solid rgba(16, 185, 129, 0.3)',
              outlineOffset: '2px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              startDrag(e, SEGMENT_VIDEO_ID, { x, y, w, h });
            }}
          >
            {/* Video content */}
            {isBrand && hasVideo ? (
              <video
                src={videoUrl}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full pointer-events-none"
                style={{ objectFit: fit }}
              />
            ) : isBrand && !hasVideo ? (
              <div className="flex flex-col items-center gap-2 pointer-events-none p-4">
                <AlertTriangle size={20} className="text-amber-400" />
                <span className="text-[9px] text-amber-300/80 text-center font-medium">
                  {previewBrand
                    ? `${previewBrand.name} no tiene ${isIntro ? 'intro' : 'outro'}`
                    : `Sin ${isIntro ? 'intro' : 'outro'} de marca`}
                </span>
                <span className="text-[8px] text-neutral-500 text-center">
                  Puedes posicionar el marco ahora — se aplicará cuando la marca tenga video
                </span>
              </div>
            ) : (
              /* Form source */
              <div className="flex flex-col items-center gap-2 pointer-events-none p-4">
                <FileText size={20} className="text-sky-400" />
                <span className="text-[9px] text-sky-300/80 text-center font-medium">
                  {scene.segmentFieldLabel || (isIntro ? 'Video de intro' : 'Video de cierre')}
                </span>
                <span className="text-[8px] text-neutral-500 text-center">
                  El productor subirá este video
                </span>
              </div>
            )}

            {/* Badge */}
            <div
              className="absolute -top-2.5 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider pointer-events-none"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Film size={7} /> {isIntro ? 'INTRO' : 'OUTRO'}
            </div>

            {/* Position readout */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[7px] text-emerald-300/60 font-mono whitespace-nowrap pointer-events-none">
              <Move size={7} /> {x.toFixed(0)},{y.toFixed(0)}
              <Maximize2 size={7} className="ml-1" /> {w.toFixed(0)}×{h.toFixed(0)}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-2 border-neutral-900 rounded-sm cursor-nwse-resize z-40 hover:opacity-80 transition-colors"
            style={{ backgroundColor: '#10b981' }}
            onPointerDown={(e) => startResize(e, SEGMENT_VIDEO_ID, { x, y, w, h })}
            title="Redimensionar video"
          />
        </div>
      </div>

      {/* Object-fit controls below canvas */}
      <div className="mt-3 flex items-center gap-2 z-10">
        <span className="text-[8px] text-neutral-500 font-mono uppercase tracking-wider">Ajuste:</span>
        <div className="flex items-center bg-neutral-800/60 rounded-lg border border-neutral-700/50 p-0.5">
          {fitOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onPositionChange({ segmentVideoFit: opt.value })}
              title={`Ajuste de video: ${opt.label}`}
              className={`px-2.5 py-1 rounded-md text-[8px] font-semibold transition-all ${
                fit === opt.value
                  ? 'bg-emerald-600/30 text-emerald-200 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={() => onPositionChange({
            segmentVideoX: 50,
            segmentVideoY: 50,
            segmentVideoW: 100,
            segmentVideoH: 100,
            segmentVideoFit: 'cover',
          })}
          title="Restablecer posición a pantalla completa"
          className="px-2 py-1 rounded-md text-[8px] text-neutral-500 hover:text-neutral-300 bg-neutral-800/40 border border-neutral-700/30 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
