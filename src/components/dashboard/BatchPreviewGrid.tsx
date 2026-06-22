/**
 * BatchPreviewGrid — Right panel for batch mode in ProductionForm.
 *
 * For IMAGE templates: shows a grid of thumbnails (each piece rendered).
 * For VIDEO templates: shows a single preview player (not N players).
 *
 * Click on a thumbnail → fullscreen carousel with prev/next navigation.
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, AlertTriangle, Eye,
} from 'lucide-react';
import { Player, PlayerRef } from '@remotion/player';
import { BrandComposition } from '../BrandComposition';
import {
  compileExpressToTimeline, getAspectDimensions, getTemplateDuration,
} from '../../utils/expressCompiler';
import type {
  BatchPieceData, ExpressTemplate, CompanyProfile, DesignMD,
} from '../../types';

interface BatchPreviewGridProps {
  pieces: BatchPieceData[];
  template: ExpressTemplate;
  brand: CompanyProfile;
  designMD: DesignMD;
  /** Active piece index for video single-preview mode */
  activePieceIndex: number;
  onActivePieceChange: (index: number) => void;
}

/**
 * Compile a single piece into Remotion inputProps.
 * Merges the piece's background URL into fieldData for the background field.
 */
function compilePiece(
  piece: BatchPieceData,
  template: ExpressTemplate,
  designMD: DesignMD,
  brand: CompanyProfile,
  backgroundFieldId: string | null,
) {
  // Build fieldData with the background injected
  const fieldData: Record<string, string> = { ...piece.fieldData };
  if (backgroundFieldId && piece.backgroundUrl) {
    fieldData[backgroundFieldId] = piece.backgroundUrl;
  }

  const result = compileExpressToTimeline(template, fieldData, designMD, brand);
  // Strip transitions for static preview
  result.elements = result.elements.map(el => ({
    ...el,
    transitionIn: undefined,
    transitionOut: undefined,
  }));
  return result;
}

/** Find the background field ID (first image/video editable-slot with isBackground) */
function findBackgroundFieldId(template: ExpressTemplate): string | null {
  for (const scene of template.scenes) {
    const fields = scene.fields ?? [];
    // First: look for explicit background field
    const bgField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video') && f.isBackground
    );
    if (bgField) return bgField.id;
    // Fallback: first editable media field
    const mediaField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video')
    );
    if (mediaField) return mediaField.id;
  }
  return null;
}

// ─── Thumbnail component (memoized) ───
const PieceThumbnail: React.FC<{
  piece: BatchPieceData;
  template: ExpressTemplate;
  designMD: DesignMD;
  brand: CompanyProfile;
  backgroundFieldId: string | null;
  dimensions: { w: number; h: number };
  totalFrames: number;
  onClick: () => void;
  isVideo: boolean;
}> = React.memo(({
  piece, template, designMD, brand, backgroundFieldId,
  dimensions, totalFrames, onClick, isVideo,
}) => {
  const compiled = useMemo(
    () => compilePiece(piece, template, designMD, brand, backgroundFieldId),
    [piece, template, designMD, brand, backgroundFieldId],
  );

  const inputProps = useMemo(() => ({
    designMD,
    timelineElements: compiled.elements,
    layers: compiled.layers,
    selectedElementId: null,
    textOverlay: '',
    brandVisibility: { logo: false, frame: false, background: true },
    outputFormat: template.format,
  }), [designMD, compiled, template.format]);

  const playerKey = useMemo(() =>
    compiled.elements
      .filter(el => el.type === 'video' || el.type === 'image')
      .map(el => el.content || '')
      .join('|'),
    [compiled],
  );

  const hasErrors = !piece.isValid || Object.keys(piece.errors).length > 0;
  const hasBackground = !!piece.backgroundUrl;

  // For text-only label, get first text field value
  const firstTextValue = (Object.values(piece.fieldData) as string[]).find(v => v?.trim());

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Pieza ${piece.index + 1}${hasErrors ? ' — datos faltantes' : ''}`}
      className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-900/20 cursor-pointer group ${
        hasErrors
          ? 'border-amber-500/40'
          : 'border-neutral-800/40 hover:border-violet-500/30'
      }`}
      style={{ aspectRatio: `${dimensions.w} / ${dimensions.h}` }}
    >
      {/* Render the piece */}
      {!isVideo ? (
        <Player
          key={playerKey}
          component={BrandComposition}
          inputProps={inputProps}
          durationInFrames={totalFrames}
          compositionWidth={dimensions.w}
          compositionHeight={dimensions.h}
          fps={30}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          controls={false}
          autoPlay={false}
        />
      ) : (
        /* For video, show a static thumbnail from the background */
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
          {hasBackground ? (
            <video
              src={piece.backgroundUrl}
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedData={(e) => {
                // Seek to 1 second for a useful thumbnail frame
                (e.target as HTMLVideoElement).currentTime = 1;
              }}
            />
          ) : (
            <div className="text-neutral-700 text-[10px]">Sin fondo</div>
          )}
        </div>
      )}

      {/* Error indicator */}
      {hasErrors && (
        <div className="absolute top-1 right-1 bg-amber-500/90 rounded-full p-0.5">
          <AlertTriangle size={10} className="text-black" />
        </div>
      )}

      {/* Text label at bottom */}
      {firstTextValue && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
          <span className="text-[9px] text-amber-400 font-medium truncate block">
            {firstTextValue}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 transition-colors flex items-center justify-center">
        <Eye size={16} className="text-white opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>
    </button>
  );
});

PieceThumbnail.displayName = 'PieceThumbnail';

// ─── Overflow "+N" indicator ───
const OverflowThumbnail: React.FC<{
  count: number;
  dimensions: { w: number; h: number };
  onClick: () => void;
}> = ({ count, dimensions, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={`Ver ${count} piezas más`}
    className="relative rounded-lg overflow-hidden border-2 border-neutral-800/40 bg-neutral-900/80 flex items-center justify-center hover:border-violet-500/30 transition-all cursor-pointer"
    style={{ aspectRatio: `${dimensions.w} / ${dimensions.h}` }}
  >
    <span className="text-lg font-bold text-neutral-400">+{count}</span>
  </button>
);

// ─── Main component ───
export const BatchPreviewGrid: React.FC<BatchPreviewGridProps> = ({
  pieces,
  template,
  brand,
  designMD,
  activePieceIndex,
  onActivePieceChange,
}) => {
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const carouselPlayerRef = useRef<PlayerRef>(null);

  const dimensions = useMemo(() => getAspectDimensions(template.aspectRatio), [template.aspectRatio]);
  const totalDuration = useMemo(() => getTemplateDuration(template), [template]);
  const totalFrames = Math.max(30, totalDuration * 30);
  const backgroundFieldId = useMemo(() => findBackgroundFieldId(template), [template]);
  const isVideo = template.format === 'video';

  const N = pieces.length;

  // Grid columns based on aspect ratio
  const gridCols = template.aspectRatio === '16:9' ? 2
    : template.aspectRatio === '1:1' ? 3
    : 3; // 9:16, 4:5, etc.

  // Max thumbnails to show in grid
  const MAX_GRID = 8;
  const visiblePieces = pieces.slice(0, MAX_GRID);
  const overflowCount = Math.max(0, N - MAX_GRID);

  // ─── Carousel ───
  const openCarousel = useCallback((index: number) => {
    setCarouselIndex(index);
  }, []);

  const closeCarousel = useCallback(() => {
    setCarouselIndex(null);
  }, []);

  const navigateCarousel = useCallback((delta: number) => {
    setCarouselIndex(prev => {
      if (prev === null) return null;
      const next = prev + delta;
      if (next < 0 || next >= N) return prev;
      return next;
    });
  }, [N]);

  // Keyboard navigation for carousel
  React.useEffect(() => {
    if (carouselIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCarousel();
      else if (e.key === 'ArrowLeft') navigateCarousel(-1);
      else if (e.key === 'ArrowRight') navigateCarousel(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [carouselIndex, closeCarousel, navigateCarousel]);

  // Compile carousel piece
  const carouselPiece = carouselIndex !== null ? pieces[carouselIndex] : null;
  const carouselCompiled = useMemo(() => {
    if (!carouselPiece) return null;
    return compilePiece(carouselPiece, template, designMD, brand, backgroundFieldId);
  }, [carouselPiece, template, designMD, brand, backgroundFieldId]);

  const carouselInputProps = useMemo(() => {
    if (!carouselCompiled) return null;
    return {
      designMD,
      timelineElements: carouselCompiled.elements,
      layers: carouselCompiled.layers,
      selectedElementId: null,
      textOverlay: '',
      brandVisibility: { logo: false, frame: false, background: true },
      outputFormat: template.format,
    };
  }, [designMD, carouselCompiled, template.format]);

  // ─── Video single preview mode ───
  const videoPreviewPiece = isVideo && N > 0 ? pieces[activePieceIndex] ?? pieces[0] : null;
  const videoCompiled = useMemo(() => {
    if (!videoPreviewPiece) return null;
    return compilePiece(videoPreviewPiece, template, designMD, brand, backgroundFieldId);
  }, [videoPreviewPiece, template, designMD, brand, backgroundFieldId]);

  const videoInputProps = useMemo(() => {
    if (!videoCompiled) return null;
    return {
      designMD,
      timelineElements: videoCompiled.elements,
      layers: videoCompiled.layers,
      selectedElementId: null,
      textOverlay: '',
      brandVisibility: { logo: false, frame: false, background: true },
      outputFormat: template.format,
    };
  }, [designMD, videoCompiled, template.format]);

  const videoPlayerKey = useMemo(() => {
    if (!videoCompiled) return '';
    return videoCompiled.elements
      .filter(el => el.type === 'video' || el.type === 'image')
      .map(el => el.content || '')
      .join('|') + `-${activePieceIndex}`;
  }, [videoCompiled, activePieceIndex]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-5 flex items-center gap-2 z-20">
        <div className={`w-2 h-2 rounded-full ${N > 0 ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
        <span className="text-xs font-semibold text-neutral-300">Preview del lote</span>
        {N > 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            {N} pieza{N !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Hint */}
      {N > 0 && !isVideo && (
        <div className="absolute top-4 right-5 z-20">
          <span className="text-[9px] text-neutral-600">
            grilla · clic = grande
          </span>
        </div>
      )}

      {N === 0 ? (
        /* Empty state */
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800/50 flex items-center justify-center mx-auto mb-3">
            <Eye size={24} className="text-neutral-700" />
          </div>
          <p className="text-xs text-neutral-500">Sube fondos para ver el preview</p>
          <p className="text-[10px] text-neutral-600 mt-1">
            Cada fondo genera una pieza con el diseño de la plantilla
          </p>
        </div>
      ) : isVideo ? (
        /* ── Video mode: Single preview with piece selector ── */
        <div className="flex flex-col items-center gap-3">
          {/* Player */}
          {videoInputProps && (
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-neutral-800/40"
              style={{
                width: template.aspectRatio === '9:16' ? 240
                  : template.aspectRatio === '1:1' ? 320
                  : template.aspectRatio === '4:5' ? 280
                  : 420,
                aspectRatio: `${dimensions.w} / ${dimensions.h}`,
                maxHeight: 'calc(100% - 120px)',
              }}
            >
              <Player
                key={videoPlayerKey}
                component={BrandComposition}
                inputProps={videoInputProps}
                durationInFrames={totalFrames}
                compositionWidth={dimensions.w}
                compositionHeight={dimensions.h}
                fps={30}
                style={{ width: '100%', height: '100%' }}
                controls
                autoPlay={false}
                loop
              />
            </div>
          )}

          {/* Piece selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onActivePieceChange(Math.max(0, activePieceIndex - 1))}
              disabled={activePieceIndex <= 0}
              title="Pieza anterior"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-[10px] text-neutral-300 font-mono min-w-[60px] text-center">
              Pieza {activePieceIndex + 1} / {N}
            </span>
            <button
              type="button"
              onClick={() => onActivePieceChange(Math.min(N - 1, activePieceIndex + 1))}
              disabled={activePieceIndex >= N - 1}
              title="Pieza siguiente"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Image mode: Thumbnail grid ── */
        <div
          className="grid gap-2 p-4 max-h-[calc(100%-80px)] overflow-y-auto custom-scrollbar"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, maxWidth: 600 }}
        >
          {visiblePieces.map((piece) => (
            <PieceThumbnail
              key={piece.index}
              piece={piece}
              template={template}
              designMD={designMD}
              brand={brand}
              backgroundFieldId={backgroundFieldId}
              dimensions={dimensions}
              totalFrames={totalFrames}
              onClick={() => openCarousel(piece.index)}
              isVideo={false}
            />
          ))}
          {overflowCount > 0 && (
            <OverflowThumbnail
              count={overflowCount}
              dimensions={dimensions}
              onClick={() => openCarousel(MAX_GRID)}
            />
          )}
        </div>
      )}

      {/* Bottom hint */}
      <p className="absolute bottom-4 text-[10px] text-neutral-600 z-10">
        {isVideo
          ? 'Mismo layout y estilo en todas las piezas.'
          : N > 0
            ? `Mismo layout y estilo en las ${N}.`
            : 'Se actualiza al cargar fondos y textos'
        }
      </p>

      {/* ═══ Fullscreen Carousel Modal ═══ */}
      {carouselIndex !== null && carouselInputProps && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
          {/* Close */}
          <button
            type="button"
            onClick={closeCarousel}
            title="Cerrar (Esc)"
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>

          {/* Navigation */}
          {carouselIndex > 0 && (
            <button
              type="button"
              onClick={() => navigateCarousel(-1)}
              title="Anterior (←)"
              className="absolute left-4 z-50 w-10 h-10 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {carouselIndex < N - 1 && (
            <button
              type="button"
              onClick={() => navigateCarousel(1)}
              title="Siguiente (→)"
              className="absolute right-4 z-50 w-10 h-10 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Piece counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full">
            <span className="text-sm text-white font-mono">
              {carouselIndex + 1} / {N}
            </span>
          </div>

          {/* Full-size preview */}
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl border border-neutral-700/30"
            style={{
              width: template.aspectRatio === '9:16' ? 380
                : template.aspectRatio === '1:1' ? 500
                : template.aspectRatio === '4:5' ? 440
                : 640,
              aspectRatio: `${dimensions.w} / ${dimensions.h}`,
              maxHeight: 'calc(100vh - 100px)',
            }}
          >
            <Player
              key={`carousel-${carouselIndex}`}
              ref={carouselPlayerRef}
              component={BrandComposition}
              inputProps={carouselInputProps}
              durationInFrames={totalFrames}
              compositionWidth={dimensions.w}
              compositionHeight={dimensions.h}
              fps={30}
              style={{ width: '100%', height: '100%' }}
              controls={isVideo}
              autoPlay={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
