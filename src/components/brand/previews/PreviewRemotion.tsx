import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Player } from '@remotion/player';
import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { DesignMD, CompanyProfile } from '../../../types';
import { CanvasWorkspace } from '../../ui/CanvasWorkspace';

interface PreviewRemotionProps {
  designMD: DesignMD;
  company: CompanyProfile;
  aspectRatio?: '16:9' | '1:1' | '9:16';
  onDesignChange?: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
  focusSegment?: 'intro' | 'content' | 'outro' | 'audio' | null;
  /** Called on every frame update with the current frame number */
  onFrameUpdate?: (frame: number) => void;
  /** Called when player is ready, passes a seek function */
  onPlayerReady?: (seekFn: (frame: number) => void) => void;
}

const COMPOSITION_DIMS: Record<string, { width: number; height: number; css: string }> = {
  '16:9': { width: 1920, height: 1080, css: '16/9' },
  '1:1': { width: 1080, height: 1080, css: '1/1' },
  '9:16': { width: 1080, height: 1920, css: '9/16' },
};

type DragElement = 'logo' | 'content' | 'intro' | 'outro'
  | 'intro-resize-br' | 'intro-resize-bl' | 'intro-resize-tr' | 'intro-resize-tl'
  | 'outro-resize-br' | 'outro-resize-bl' | 'outro-resize-tr' | 'outro-resize-tl'
  | null;

/** Parse a CSS object-position string to x/y percentages */
function parseVideoPosition(pos?: string): { x: number; y: number } {
  if (!pos) return { x: 50, y: 50 };
  if (pos.includes('%')) {
    const parts = pos.split(/\s+/);
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 };
  }
  const map: Record<string, { x: number; y: number }> = {
    'top left': { x: 0, y: 0 }, 'top center': { x: 50, y: 0 }, 'top right': { x: 100, y: 0 }, 'top': { x: 50, y: 0 },
    'center left': { x: 0, y: 50 }, 'center': { x: 50, y: 50 }, 'center right': { x: 100, y: 50 },
    'bottom left': { x: 0, y: 100 }, 'bottom center': { x: 50, y: 100 }, 'bottom right': { x: 100, y: 100 }, 'bottom': { x: 50, y: 100 },
    'left': { x: 0, y: 50 }, 'right': { x: 100, y: 50 },
  };
  return map[pos] || { x: 50, y: 50 };
}

/**
 * Live Remotion Player showing a sample composition with the brand's DesignMD settings.
 * Supports interactive drag-to-reposition for logo and content block.
 */
export const PreviewRemotion: React.FC<PreviewRemotionProps> = ({ designMD, company, aspectRatio = '9:16', onDesignChange, focusSegment, onFrameUpdate, onPlayerReady }) => {
  const hasIntro = !!designMD.introVideoUrl;
  const hasOutro = !!designMD.outroVideoUrl;
  const introDur = designMD.introDurationFrames || 60;
  const outroDur = designMD.outroDurationFrames || 60;
  const contentDur = 180;
  const totalDur = (hasIntro ? introDur : 0) + contentDur + (hasOutro ? outroDur : 0);

  const dims = COMPOSITION_DIMS[aspectRatio] || COMPOSITION_DIMS['9:16'];

  // Compute frame ranges for each segment
  const introStart = 0;
  const contentStart = hasIntro ? introDur : 0;
  const outroStart = contentStart + contentDur;

  // Player ref for seeking
  const playerRef = useRef<any>(null);

  // Drag state for the overlay
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragElement, setDragElement] = useState<DragElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; origX: number; origY: number } | null>(null);

  // Current positions
  const logoX = designMD.logoX ?? 10;
  const logoY = designMD.logoY ?? 5;
  const contentX = designMD.contentX ?? 50;
  const contentY = designMD.contentY ?? 75;

  // Video box positions & sizes (% of canvas)
  const introX = designMD.introVideoX ?? 0;
  const introY = designMD.introVideoY ?? 0;
  const introW = designMD.introVideoW ?? 100;
  const introH = designMD.introVideoH ?? 100;
  const outroX = designMD.outroVideoX ?? 0;
  const outroY = designMD.outroVideoY ?? 0;
  const outroW = designMD.outroVideoW ?? 100;
  const outroH = designMD.outroVideoH ?? 100;

  const getOrigForElement = useCallback((element: DragElement) => {
    switch (element) {
      case 'logo': return { x: logoX, y: logoY };
      case 'content': return { x: contentX, y: contentY };
      case 'intro': return { x: introX, y: introY };
      case 'outro': return { x: outroX, y: outroY };
      default: return { x: 50, y: 50 };
    }
  }, [logoX, logoY, contentX, contentY, introX, introY, outroX, outroY]);

  const handlePointerDown = useCallback((e: React.PointerEvent, element: DragElement) => {
    if (!onDesignChange) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragElement(element);
    const orig = getOrigForElement(element);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      origX: orig.x,
      origY: orig.y,
    });
  }, [onDesignChange, getOrigForElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragElement || !dragStart || !overlayRef.current || !onDesignChange) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragStart.y) / rect.height) * 100;

    // No clamping — allow elements to extend beyond canvas boundaries
    const newX = Math.round(dragStart.origX + deltaXPct);
    const newY = Math.round(dragStart.origY + deltaYPct);

    if (dragElement === 'logo') {
      onDesignChange('logoX', newX);
      onDesignChange('logoY', newY);
    } else if (dragElement === 'content') {
      onDesignChange('contentX', newX);
      onDesignChange('contentY', newY);
    } else if (dragElement === 'intro') {
      onDesignChange('introVideoX', newX);
      onDesignChange('introVideoY', newY);
    } else if (dragElement === 'outro') {
      onDesignChange('outroVideoX', newX);
      onDesignChange('outroVideoY', newY);
    } else if (dragElement?.startsWith('intro-resize-')) {
      const corner = dragElement.replace('intro-resize-', '');
      if (corner === 'br') {
        onDesignChange('introVideoW', Math.max(10, Math.round(introW + deltaXPct)));
        onDesignChange('introVideoH', Math.max(10, Math.round(introH + deltaYPct)));
      } else if (corner === 'bl') {
        onDesignChange('introVideoX', Math.round(introX + deltaXPct));
        onDesignChange('introVideoW', Math.max(10, Math.round(introW - deltaXPct)));
        onDesignChange('introVideoH', Math.max(10, Math.round(introH + deltaYPct)));
      } else if (corner === 'tr') {
        onDesignChange('introVideoY', Math.round(introY + deltaYPct));
        onDesignChange('introVideoW', Math.max(10, Math.round(introW + deltaXPct)));
        onDesignChange('introVideoH', Math.max(10, Math.round(introH - deltaYPct)));
      } else if (corner === 'tl') {
        onDesignChange('introVideoX', Math.round(introX + deltaXPct));
        onDesignChange('introVideoY', Math.round(introY + deltaYPct));
        onDesignChange('introVideoW', Math.max(10, Math.round(introW - deltaXPct)));
        onDesignChange('introVideoH', Math.max(10, Math.round(introH - deltaYPct)));
      }
      setDragStart({ ...dragStart, x: e.clientX, y: e.clientY });
    } else if (dragElement?.startsWith('outro-resize-')) {
      const corner = dragElement.replace('outro-resize-', '');
      if (corner === 'br') {
        onDesignChange('outroVideoW', Math.max(10, Math.round(outroW + deltaXPct)));
        onDesignChange('outroVideoH', Math.max(10, Math.round(outroH + deltaYPct)));
      } else if (corner === 'bl') {
        onDesignChange('outroVideoX', Math.round(outroX + deltaXPct));
        onDesignChange('outroVideoW', Math.max(10, Math.round(outroW - deltaXPct)));
        onDesignChange('outroVideoH', Math.max(10, Math.round(outroH + deltaYPct)));
      } else if (corner === 'tr') {
        onDesignChange('outroVideoY', Math.round(outroY + deltaYPct));
        onDesignChange('outroVideoW', Math.max(10, Math.round(outroW + deltaXPct)));
        onDesignChange('outroVideoH', Math.max(10, Math.round(outroH - deltaYPct)));
      } else if (corner === 'tl') {
        onDesignChange('outroVideoX', Math.round(outroX + deltaXPct));
        onDesignChange('outroVideoY', Math.round(outroY + deltaYPct));
        onDesignChange('outroVideoW', Math.max(10, Math.round(outroW - deltaXPct)));
        onDesignChange('outroVideoH', Math.max(10, Math.round(outroH - deltaYPct)));
      }
      setDragStart({ ...dragStart, x: e.clientX, y: e.clientY });
    }
  }, [dragElement, dragStart, onDesignChange, introX, introY, introW, introH, outroX, outroY, outroW, outroH]);

  const handlePointerUp = useCallback(() => {
    setDragElement(null);
    setDragStart(null);
  }, []);

  // Seek player to the focused segment when it changes
  useEffect(() => {
    if (!playerRef.current || !focusSegment) return;
    const player = playerRef.current;
    try {
      player.pause();
      let targetFrame = 0;
      if (focusSegment === 'intro') targetFrame = introStart;
      else if (focusSegment === 'content') targetFrame = contentStart;
      else if (focusSegment === 'outro') targetFrame = outroStart;
      player.seekTo(targetFrame);
    } catch {
      // Player may not be ready yet
    }
  }, [focusSegment, introStart, contentStart, outroStart]);

  // Expose seek function to parent
  useEffect(() => {
    if (!playerRef.current || !onPlayerReady) return;
    const player = playerRef.current;
    onPlayerReady((frame: number) => {
      try {
        player.pause();
        player.seekTo(frame);
      } catch { /* noop */ }
    });
  }, [onPlayerReady]);

  // Subscribe to frame updates
  useEffect(() => {
    if (!playerRef.current || !onFrameUpdate) return;
    const player = playerRef.current;
    const handler = (e: { detail: { frame: number } }) => {
      onFrameUpdate(e.detail.frame);
    };
    player.addEventListener('frameupdate', handler);
    return () => player.removeEventListener('frameupdate', handler);
  }, [onFrameUpdate]);

  const inputProps = useMemo(() => ({
    designMD,
    company,
    introDur,
    outroDur,
    contentDur,
    hasIntro,
    hasOutro,
  }), [designMD, company, introDur, outroDur, contentDur, hasIntro, hasOutro]);

  // Whether we're in editing mode (a segment is focused)
  const isEditing = !!focusSegment && focusSegment !== 'audio';

  return (
    <div className="flex flex-col items-center h-full max-h-full">
      <CanvasWorkspace
        aspectRatio={dims.css}
        isEditing={isEditing}
        canvasClassName="rounded-2xl shadow-2xl border border-neutral-800 bg-neutral-900"
        overlayRef={overlayRef}
        overlayPointerEvents={!!dragElement}
        onOverlayPointerMove={handlePointerMove}
        onOverlayPointerUp={handlePointerUp}
        overlay={onDesignChange ? (
          <>
            {/* Logo drag handle — only when content segment is selected */}
            {focusSegment === 'content' && (
            <div
              className={`absolute cursor-grab active:cursor-grabbing transition-all ${
                dragElement === 'logo' ? 'z-20 scale-110' : 'hover:ring-2 hover:ring-violet-400/40 hover:ring-offset-2 hover:ring-offset-transparent'
              }`}
              style={{
                left: `${logoX}%`,
                top: `${logoY}%`,
                pointerEvents: 'auto',
                padding: '8px',
                borderRadius: '8px',
              }}
              onPointerDown={(e) => handlePointerDown(e, 'logo')}
              title="Arrastra para mover el logo"
            >
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[9px] font-bold text-violet-300 uppercase tracking-wider">Logo</span>
              </div>
            </div>
            )}

            {/* Content block drag handle — only when content segment is selected */}
            {focusSegment === 'content' && (
            <div
              className={`absolute cursor-grab active:cursor-grabbing transition-all -translate-x-1/2 ${
                dragElement === 'content' ? 'z-20 scale-110' : 'hover:ring-2 hover:ring-amber-400/40 hover:ring-offset-2 hover:ring-offset-transparent'
              }`}
              style={{
                left: `${contentX}%`,
                top: `${contentY}%`,
                pointerEvents: 'auto',
                padding: '8px',
                borderRadius: '8px',
              }}
              onPointerDown={(e) => handlePointerDown(e, 'content')}
              title="Arrastra para mover el bloque de texto"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">Texto</span>
              </div>
            </div>
            )}

            {/* Intro video box — only when intro is selected */}
            {hasIntro && focusSegment === 'intro' && (
              <VideoBoxHandle
                label="Intro"
                color="emerald"
                x={introX}
                y={introY}
                w={introW}
                h={introH}
                isDragging={dragElement === 'intro' || !!dragElement?.startsWith('intro-resize')}
                onMoveDown={(e) => handlePointerDown(e, 'intro')}
                onResizeDown={(e, corner) => handlePointerDown(e, `intro-resize-${corner}` as DragElement)}
              />
            )}

            {/* Outro video box — only when outro is selected */}
            {hasOutro && focusSegment === 'outro' && (
              <VideoBoxHandle
                label="Outro"
                color="rose"
                x={outroX}
                y={outroY}
                w={outroW}
                h={outroH}
                isDragging={dragElement === 'outro' || !!dragElement?.startsWith('outro-resize')}
                onMoveDown={(e) => handlePointerDown(e, 'outro')}
                onResizeDown={(e, corner) => handlePointerDown(e, `outro-resize-${corner}` as DragElement)}
              />
            )}
          </>
        ) : undefined}
      >
        <Player
          ref={playerRef}
          component={SampleComposition}
          inputProps={inputProps}
          durationInFrames={Math.max(totalDur, 60)}
          compositionWidth={dims.width}
          compositionHeight={dims.height}
          fps={30}
          controls
          loop={!focusSegment || focusSegment === 'audio'}
          autoPlay={!focusSegment || focusSegment === 'audio'}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </CanvasWorkspace>

      {/* Info bar */}
      <div className="flex items-center gap-3 mt-3 shrink-0">
        <span className="text-[10px] font-mono text-neutral-500">
          {(totalDur / 30).toFixed(1)}s · {aspectRatio} · {dims.width}×{dims.height} · 30fps
        </span>
        <div className="flex gap-1.5">
          {hasIntro && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
              INTRO
            </span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            CONTENIDO
          </span>
          {hasOutro && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
              OUTRO
            </span>
          )}
        </div>
        {onDesignChange && (
          <span className="text-[9px] text-violet-400/50 ml-1">
            ↕ Drag handles para posicionar
          </span>
        )}
      </div>
    </div>
  );
};

// ═══ Sample Remotion Composition ═══

interface SampleProps {
  designMD: DesignMD;
  company: CompanyProfile;
  introDur: number;
  outroDur: number;
  contentDur: number;
  hasIntro: boolean;
  hasOutro: boolean;
}

const SampleComposition: React.FC<SampleProps> = ({
  designMD,
  company,
  introDur,
  outroDur,
  contentDur,
  hasIntro,
  hasOutro,
}) => {
  const contentStart = hasIntro ? introDur : 0;
  const outroStart = contentStart + contentDur;

  return (
    <AbsoluteFill style={{ backgroundColor: designMD.secondaryColor }}>
      {/* Brand Frame — always visible */}
      <AbsoluteFill
        style={{
          border: `${designMD.frameThickness}px solid ${designMD.primaryColor}`,
          boxSizing: 'border-box',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* ── INTRO SEQUENCE ── */}
      {hasIntro && (
        <Sequence from={0} durationInFrames={introDur} name="Intro">
          <IntroSection designMD={designMD} company={company} />
        </Sequence>
      )}

      {/* ── CONTENT SEQUENCE ── */}
      <Sequence from={contentStart} durationInFrames={contentDur} name="Content">
        <ContentSection designMD={designMD} company={company} />
      </Sequence>

      {/* ── OUTRO SEQUENCE ── */}
      {hasOutro && (
        <Sequence from={outroStart} durationInFrames={outroDur} name="Outro">
          <OutroSection designMD={designMD} company={company} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ═══ INTRO ═══

const IntroSection: React.FC<{ designMD: DesignMD; company: CompanyProfile }> = ({ designMD, company }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (designMD.introVideoUrl) {
    const vx = designMD.introVideoX ?? 0;
    const vy = designMD.introVideoY ?? 0;
    const vw = designMD.introVideoW ?? 100;
    const vh = designMD.introVideoH ?? 100;
    return (
      <AbsoluteFill>
        <div style={{
          position: 'absolute',
          left: `${vx}%`, top: `${vy}%`,
          width: `${vw}%`, height: `${vh}%`,
          overflow: 'hidden',
          borderRadius: vw < 100 || vh < 100 ? 8 : 0,
        }}>
          <Video
            src={designMD.introVideoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: (designMD.introVideoFit || 'cover') as React.CSSProperties['objectFit'],
            }}
            volume={0}
          />
        </div>
        {/* Logo overlay on intro video */}
        {designMD.logoUrl && (
          <div style={{
            position: 'absolute',
            left: `${designMD.logoX ?? 5}%`,
            top: `${designMD.logoY ?? 5}%`,
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <img src={designMD.logoUrl} alt="" style={{ width: 160, objectFit: 'contain' }} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // Fallback placeholder intro
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: designMD.primaryColor }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        {designMD.logoUrl && (
          <img src={designMD.logoUrl} alt="" style={{ width: 240, margin: '0 auto 24px', objectFit: 'contain' }} />
        )}
        <h1 style={{
          fontFamily: designMD.titleFont || designMD.baseFont,
          color: designMD.textColor,
          fontSize: 72,
          fontWeight: 'bold',
        }}>
          {company.name || 'INTRO'}
        </h1>
      </div>
    </AbsoluteFill>
  );
};

// ═══ CONTENT ═══

const ContentSection: React.FC<{ designMD: DesignMD; company: CompanyProfile }> = ({ designMD, company }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const transitionIn = designMD.defaultTransitionIn || 'fade';
  const transitionOut = designMD.defaultTransitionOut || 'none';

  const entryStyle = getTransitionStyle(transitionIn, frame, fps, 'in');
  const exitFrame = durationInFrames - frame;
  const exitStyle = transitionOut !== 'none' ? getTransitionStyle(transitionOut, exitFrame, fps, 'out') : {};
  const combinedTextStyle = frame < 25 ? entryStyle : exitFrame < 25 ? exitStyle : {};

  // Use freeform positions if set, otherwise fall back to preset
  const logoX = designMD.logoX ?? 5;
  const logoY = designMD.logoY ?? 5;
  const contentX = designMD.contentX ?? 50;
  const contentY = designMD.contentY ?? 75;

  return (
    <AbsoluteFill
      style={{
        padding: `${designMD.frameThickness + 40}px`,
      }}
    >
      {/* Logo — freeform positioned */}
      {designMD.logoUrl && (
        <div style={{
          position: 'absolute',
          left: `${logoX}%`,
          top: `${logoY}%`,
          ...combinedTextStyle,
        }}>
          <img src={designMD.logoUrl} alt="" style={{ width: 160, objectFit: 'contain' }} />
        </div>
      )}

      {/* Text block — freeform positioned */}
      <div
        style={{
          position: 'absolute',
          left: `${contentX}%`,
          top: `${contentY}%`,
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          padding: '48px 36px',
          borderRadius: 24,
          textAlign: 'center',
          maxWidth: '80%',
          ...combinedTextStyle,
        }}
      >
        <h1 style={{
          fontFamily: designMD.titleFont || designMD.baseFont,
          color: designMD.titleColor || designMD.textColor,
          fontSize: designMD.titleSize || 64,
          fontWeight: 'bold',
          lineHeight: 1.1,
          margin: 0,
        }}>
          {company.name || 'Tu Marca'}
        </h1>

        {company.tagline && (
          <p style={{
            fontFamily: designMD.subtitleFont || designMD.baseFont,
            color: designMD.subtitleColor || designMD.textColor,
            fontSize: designMD.subtitleSize || 32,
            marginTop: 16,
            opacity: 0.9,
            lineHeight: 1.3,
          }}>
            {company.tagline}
          </p>
        )}

        {company.socialLinks?.instagram && (
          <p style={{
            fontFamily: designMD.paragraphFont || designMD.baseFont,
            color: designMD.primaryColor,
            fontSize: 28,
            marginTop: 24,
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            {company.socialLinks.instagram}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ═══ OUTRO ═══

const OutroSection: React.FC<{ designMD: DesignMD; company: CompanyProfile }> = ({ designMD, company }) => {
  const frame = useCurrentFrame();

  if (designMD.outroVideoUrl) {
    const vx = designMD.outroVideoX ?? 0;
    const vy = designMD.outroVideoY ?? 0;
    const vw = designMD.outroVideoW ?? 100;
    const vh = designMD.outroVideoH ?? 100;
    return (
      <AbsoluteFill>
        <div style={{
          position: 'absolute',
          left: `${vx}%`, top: `${vy}%`,
          width: `${vw}%`, height: `${vh}%`,
          overflow: 'hidden',
          borderRadius: vw < 100 || vh < 100 ? 8 : 0,
        }}>
          <Video
            src={designMD.outroVideoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: (designMD.outroVideoFit || 'cover') as React.CSSProperties['objectFit'],
            }}
            volume={0}
          />
        </div>
        {designMD.logoUrl && (
          <div style={{
            position: 'absolute',
            left: `${designMD.logoX ?? 5}%`,
            top: `${designMD.logoY ?? 5}%`,
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <img src={designMD.logoUrl} alt="" style={{ width: 160, objectFit: 'contain' }} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // Fallback placeholder outro
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: designMD.primaryColor, opacity }}>
      <div style={{ textAlign: 'center' }}>
        {designMD.logoUrl && (
          <img src={designMD.logoUrl} alt="" style={{ width: 180, margin: '0 auto 20px', objectFit: 'contain' }} />
        )}
        <p style={{
          fontFamily: designMD.baseFont,
          color: designMD.textColor,
          fontSize: 36,
          opacity: 0.8,
        }}>
          {company.socialLinks?.website || company.socialLinks?.instagram || company.name}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ═══ HELPERS ═══

function getTransitionStyle(
  type: string,
  frame: number,
  fps: number,
  direction: 'in' | 'out'
): React.CSSProperties {
  const progress = Math.min(frame / 18, 1);
  
  switch (type) {
    case 'fade':
      return { opacity: progress };
    case 'slideUp':
      return { opacity: progress, transform: `translateY(${(1 - progress) * 80}px)` };
    case 'slideRight':
      return { opacity: progress, transform: `translateX(${(progress - 1) * 100}px)` };
    case 'bounce': {
      const s = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
      return { transform: `scale(${s})` };
    }
    case 'scale':
      return { opacity: progress, transform: `scale(${0.4 + progress * 0.6})` };
    case 'typewriter':
      return { opacity: Math.round(progress * 4) / 4 };
    default:
      return {};
  }
}

// ═══ VideoBoxHandle — resizable rectangle with corner handles ═══

const CORNER_CURSORS: Record<string, string> = {
  tl: 'nwse-resize', tr: 'nesw-resize',
  bl: 'nesw-resize', br: 'nwse-resize',
};

interface VideoBoxHandleProps {
  label: string;
  color: 'emerald' | 'rose';
  x: number; y: number; w: number; h: number;
  isDragging: boolean;
  onMoveDown: (e: React.PointerEvent) => void;
  onResizeDown: (e: React.PointerEvent, corner: string) => void;
}

const COLOR_MAP = {
  emerald: { border: '#10b981', bg: 'rgba(16,185,129,0.08)', text: '#6ee7b7', label: 'rgba(16,185,129,0.15)' },
  rose: { border: '#f43f5e', bg: 'rgba(244,63,94,0.08)', text: '#fda4af', label: 'rgba(244,63,94,0.15)' },
};

const VideoBoxHandle: React.FC<VideoBoxHandleProps> = ({ label, color, x, y, w, h, isDragging, onMoveDown, onResizeDown }) => {
  const c = COLOR_MAP[color];
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`, top: `${y}%`,
        width: `${w}%`, height: `${h}%`,
        pointerEvents: 'auto',
        zIndex: isDragging ? 30 : 10,
      }}
    >
      {/* Border + background */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          border: `2px ${isDragging ? 'solid' : 'dashed'} ${c.border}`,
          borderRadius: '8px',
          background: c.bg,
        }}
        onPointerDown={onMoveDown}
        title={`Arrastra para mover ${label}`}
      >
        {/* Label */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
          style={{ background: c.label, color: c.text, border: `1px solid ${c.border}40` }}
        >
          {label}
        </div>
        {/* Size info */}
        <div
          className="absolute bottom-1 right-2 text-[8px] font-mono opacity-60"
          style={{ color: c.text }}
        >
          {w}% × {h}%
        </div>
      </div>

      {/* Corner resize handles */}
      {(['tl', 'tr', 'bl', 'br'] as const).map(corner => (
        <div
          key={corner}
          className="absolute w-3 h-3 rounded-full border-2 bg-neutral-950"
          style={{
            borderColor: c.border,
            cursor: CORNER_CURSORS[corner],
            ...(corner.includes('t') ? { top: -6 } : { bottom: -6 }),
            ...(corner.includes('l') ? { left: -6 } : { right: -6 }),
            pointerEvents: 'auto',
            zIndex: 40,
          }}
          onPointerDown={(e) => onResizeDown(e, corner)}
          title={`Redimensionar ${label}`}
        />
      ))}
    </div>
  );
};
