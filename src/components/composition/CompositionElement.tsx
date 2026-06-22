import React, { RefObject, useEffect } from 'react';
import { Sequence, AbsoluteFill, Img, Video, Audio, interpolate } from 'remotion';
import { TimelineElement, TimelineLayer, DesignMD } from '../../types';
import { calculateElementTransitions } from './useTransitions';
import { resolveKeyframes } from './keyframeEngine';
import { ChromaKeyImage } from './ChromaKeyImage';
import { ChromaKeyVideo } from './ChromaKeyVideo';
import type { CanvasActionMode } from './ElementActionToolbar';
import { loadGoogleFont } from '../../utils/googleFontsApi';

interface CompositionElementProps {
  element: TimelineElement;
  layer: TimelineLayer | undefined;
  designMD: DesignMD;
  frame: number;
  selectedElementId: string | null;
  activeLayerId: string | null;
  activeAction: CanvasActionMode;
  isImageMode?: boolean;
  tempPositions: Record<string, { x: number; y: number; scale?: number; rotation?: number }>;
  dragStateId: string | null;
  containerRef: RefObject<HTMLDivElement>;
  onElementClick?: (id: string) => void;
  onElementDoubleClick?: (id: string) => void;
  onElementContextMenu?: (id: string, e: React.MouseEvent) => void;
  onDragStart: (id: string, startX: number, startY: number, initialElX: number, initialElY: number) => void;
  onTransformStart: (id: string, type: 'scale' | 'rotate', startX: number, startY: number, initialScale: number, initialRot: number, centerX: number, centerY: number) => void;
  onElementDuplicate?: (id: string) => void;
  onElementDelete?: (id: string) => void;
  onElementLock?: (id: string) => void;
}

export const CompositionElement: React.FC<CompositionElementProps> = ({
  element: el,
  layer,
  designMD,
  frame,
  selectedElementId,
  activeLayerId,
  activeAction,
  isImageMode = false,
  tempPositions,
  dragStateId,
  containerRef,
  onElementClick,
  onElementDoubleClick,
  onElementContextMenu,
  onDragStart,
  onTransformStart,
  onElementDuplicate,
  onElementDelete,
  onElementLock,
}) => {
  // ─── Dynamic font loading for text elements ───
  const fontFamily = el.type === 'text' ? (el.fontFamily ?? designMD.baseFont) : null;
  useEffect(() => {
    if (fontFamily) loadGoogleFont(fontFamily);
  }, [fontFamily]);

  // In image mode: all non-locked elements are interactive (Photoshop model)
  // In video mode: only elements on the active layer are interactive
  const isInteractive = isImageMode
    ? !el.isLocked
    : (!!activeLayerId && el.layerId === activeLayerId) && !el.isLocked;

  // Skip hidden elements (after all hooks to satisfy Rules of Hooks)
  if (el.isHidden) return null;
  const isSelected = selectedElementId === el.id;
  const layerOpacity = layer?.opacity ?? 1;
  const baseOpacity = ((el.opacity ?? 100) / 100) * layerOpacity;
  
  const currentScale = tempPositions[el.id]?.scale ?? el.scale ?? 1;
  const currentRot = tempPositions[el.id]?.rotation ?? el.rotation ?? 0;
  const tempX = tempPositions[el.id]?.x;
  const tempY = tempPositions[el.id]?.y;

  const { opacity, transformStr, displayContent } = calculateElementTransitions(
    el, frame, baseOpacity, currentScale, currentRot, tempX, tempY
  );

  // Resolve position — multi-keyframes take priority over legacy animEnd*
  let currentX = tempX ?? el.x;
  let currentY = tempY ?? el.y;

  if (el.keyframes && el.keyframes.length >= 2 && !tempPositions[el.id]) {
    // Multi-keyframe: resolve x/y from keyframe engine
    const resolved = resolveKeyframes(el.keyframes, frame, {
      x: el.x, y: el.y,
      scale: currentScale, opacity: baseOpacity, rotation: currentRot,
    });
    currentX = resolved.x;
    currentY = resolved.y;
  } else if (!el.keyframes) {
    // Legacy 2-point keyframes
    if (el.animEndX !== undefined) {
      currentX = interpolate(frame, [el.startFrame, el.endFrame], [tempX ?? el.x, el.animEndX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
    if (el.animEndY !== undefined) {
      currentY = interpolate(frame, [el.startFrame, el.endFrame], [tempY ?? el.y, el.animEndY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
  }

  const isFullscreenBrand = el.isBrandElement && (el.brandDisplayMode ?? 'fullscreen') === 'fullscreen' && el.type === 'video';

  const resolvedBlendMode = (() => {
    // When chroma key is active, transparency is handled by the canvas — no CSS blend needed
    if (el.chromaKeyEnabled) return 'normal';
    if (!el.isBrandElement) return el.blendMode || 'normal';
    if (el.content === designMD.introVideoUrl) return designMD.introBlendMode || el.blendMode || 'normal';
    if (el.content === designMD.outroVideoUrl) return designMD.outroBlendMode || el.blendMode || 'normal';
    return el.blendMode || 'normal';
  })();

  // Chroma key defaults
  const ckColor = el.chromaKeyColor || '#ffffff';
  const ckTolerance = el.chromaKeyTolerance ?? 30;
  const ckSoftness = el.chromaKeySoftness ?? 10;

  const filterStr = `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) saturate(${el.saturation ?? 100}%)${el.hueRotate ? ` hue-rotate(${el.hueRotate}deg)` : ''}${el.sepia ? ` sepia(${el.sepia}%)` : ''}${el.blurAmount ? ` blur(${el.blurAmount}px)` : ''}`;

  // Contain background: wrap media in a colored container when objectFit='contain' and color is set
  const hasContainBg = (el.objectFit === 'contain' || !el.objectFit) && !!el.containBgColor;
  const containBgStyle: React.CSSProperties | undefined = hasContainBg ? {
    width: '100%',
    height: el.height ? '100%' : 'auto',
    backgroundColor: el.containBgColor!,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } : undefined;

  // ── Transform helpers ──

  const startScaleDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    onTransformStart(
      el.id, 'scale', e.clientX, e.clientY,
      currentScale, currentRot,
      rect.left + (currentX / 100) * rect.width,
      rect.top + (currentY / 100) * rect.height
    );
  };

  const startRotateDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    onTransformStart(
      el.id, 'rotate', e.clientX, e.clientY,
      currentScale, currentRot,
      rect.left + (currentX / 100) * rect.width,
      rect.top + (currentY / 100) * rect.height
    );
  };

  const startDrag = (e: React.PointerEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    if (e.button === 2) return;
    if (onElementClick) onElementClick(el.id);
    
    // In move mode: drag moves. In scale/rotate: start respective transform.
    if (activeAction === 'move') {
      onDragStart(el.id, e.clientX, e.clientY, currentX, currentY);
    } else if (activeAction === 'scale') {
      startScaleDrag(e);
    } else if (activeAction === 'rotate') {
      startRotateDrag(e);
    }
  };

  // ── Selection outline color ──
  const outlineColor = el.isLocked ? '#d97706' : '#8b5cf6';

  return (
    <Sequence from={el.startFrame} durationInFrames={Math.max(1, el.endFrame - el.startFrame)}>
      {el.type === 'audio' ? ((() => {
          const layerVol = (layer?.volume ?? 100) / 100;
          const elVol = el.volume ?? 1;
          const isMuted = layer?.isMuted === true;

          // Build volume callback for Remotion <Audio>
          const volumeCallback = (f: number) => {
            if (isMuted) return 0;

            let vol = layerVol * elVol;

            // Fade in
            const fadeIn = el.fadeInFrames ?? 0;
            if (fadeIn > 0 && f < fadeIn) {
              vol *= interpolate(f, [0, fadeIn], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
            }

            // Fade out
            const fadeOut = el.fadeOutFrames ?? 0;
            const clipDuration = el.endFrame - el.startFrame;
            if (fadeOut > 0 && f > clipDuration - fadeOut) {
              vol *= interpolate(f, [clipDuration - fadeOut, clipDuration], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
            }

            // Volume keyframes
            const vkfs = el.volumeKeyframes;
            if (vkfs && vkfs.length > 0) {
              const sorted = [...vkfs].sort((a, b) => a.frame - b.frame);
              let before = sorted[0];
              let after = sorted[sorted.length - 1];
              for (let i = 0; i < sorted.length - 1; i++) {
                if (f >= sorted[i].frame && f <= sorted[i + 1].frame) {
                  before = sorted[i];
                  after = sorted[i + 1];
                  break;
                }
              }
              if (f <= before.frame) {
                vol *= before.volume;
              } else if (f >= after.frame) {
                vol *= after.volume;
              } else {
                const kfVol = interpolate(f, [before.frame, after.frame], [before.volume, after.volume], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                vol *= kfVol;
              }
            }

            return Math.max(0, Math.min(1, vol));
          };

          return <Audio src={el.content} volume={volumeCallback} />;
        })()) : isFullscreenBrand ? (
        /* ═══ Fullscreen Brand Video ═══ */
        <AbsoluteFill
          style={{ 
            cursor: isInteractive ? 'pointer' : 'default', 
            pointerEvents: isInteractive ? 'auto' : 'none',
            mixBlendMode: resolvedBlendMode !== 'normal' ? resolvedBlendMode as React.CSSProperties['mixBlendMode'] : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isInteractive && onElementClick) onElementClick(el.id);
          }}
        >
          {/* Positioned container — matches branding preview (PreviewRemotion) */}
          <div style={{
            position: 'absolute',
            left: `${el.x ?? 0}%`,
            top: `${el.y ?? 0}%`,
            width: `${el.w ?? 100}%`,
            height: `${el.h ?? 100}%`,
            overflow: 'hidden',
            borderRadius: (el.w ?? 100) < 100 || (el.h ?? 100) < 100 ? 8 : 0,
          }}>
            {el.chromaKeyEnabled ? (
              <ChromaKeyVideo
                src={el.content}
                chromaKeyColor={ckColor}
                chromaKeyTolerance={ckTolerance}
                chromaKeySoftness={ckSoftness}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: (el.objectFit || (() => {
                    if (el.content === designMD.introVideoUrl) return designMD.introVideoFit || 'cover';
                    if (el.content === designMD.outroVideoUrl) return designMD.outroVideoFit || 'cover';
                    return 'cover';
                  })()) as React.CSSProperties['objectFit'],
                  opacity: opacity,
                  filter: filterStr,
                }}
              />
            ) : (
              <Video 
                src={el.content}
                volume={el.volume ?? 1}
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: (el.objectFit || (() => {
                    if (el.content === designMD.introVideoUrl) return designMD.introVideoFit || 'cover';
                    if (el.content === designMD.outroVideoUrl) return designMD.outroVideoFit || 'cover';
                    return 'cover';
                  })()) as React.CSSProperties['objectFit'],
                  opacity: opacity,
                  pointerEvents: 'none',
                  filter: filterStr,
                }}
              />
            )}
          </div>
          {isSelected && (
            <div style={{
              position: 'absolute',
              left: `${el.x ?? 0}%`,
              top: `${el.y ?? 0}%`,
              width: `${el.w ?? 100}%`,
              height: `${el.h ?? 100}%`,
              border: '3px solid #d97706',
              pointerEvents: 'none',
              borderRadius: (el.w ?? 100) < 100 || (el.h ?? 100) < 100 ? 8 : 0,
            }} />
          )}
        </AbsoluteFill>
      ) : (
      /* ═══ Normal Positioned Element ═══ */
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: `${currentX}%`,
              top: `${currentY}%`,
              width: el.type === 'text' ? (el.width ? `${el.width}%` : undefined) : `${el.width ?? 25}%`,
              height: el.height ? `${el.height}%` : undefined,
              transform: `${transformStr}${el.flipH ? ' scaleX(-1)' : ''}${el.flipV ? ' scaleY(-1)' : ''}`,
              opacity: opacity,
              cursor: isInteractive
                ? (activeAction === 'move'
                    ? (dragStateId === el.id ? 'grabbing' : 'grab')
                    : activeAction === 'scale' ? 'nwse-resize'
                    : activeAction === 'rotate' ? 'alias'
                    : 'grab')
                : (el.isLocked ? 'not-allowed' : 'default'),
              outline: isSelected ? `${Math.max(1, 3 / currentScale)}px dashed ${outlineColor}` : 'none',
              outlineOffset: `${6 / currentScale}px`,
              pointerEvents: isInteractive || isSelected ? 'auto' : 'none',
              mixBlendMode: resolvedBlendMode !== 'normal' ? resolvedBlendMode as React.CSSProperties['mixBlendMode'] : undefined,
              border: el.borderWidth ? `${el.borderWidth}px ${el.borderStyle ?? 'solid'} ${el.borderColor ?? '#ffffff'}` : undefined,
              borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
              overflow: (el.height || el.borderRadius) ? 'hidden' : undefined,
              boxShadow: el.boxShadowBlur || el.boxShadowX || el.boxShadowY
                ? `${el.boxShadowX ?? 0}px ${el.boxShadowY ?? 4}px ${el.boxShadowBlur ?? 10}px ${el.boxShadowColor ?? 'rgba(0,0,0,0.5)'}` 
                : undefined,
            }}
            onClick={(e) => { e.stopPropagation(); }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (isInteractive && onElementDoubleClick) onElementDoubleClick(el.id);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInteractive && onElementContextMenu) onElementContextMenu(el.id, e as unknown as React.MouseEvent);
            }}
            onPointerDown={startDrag}
          >
          {/* ── Content ── */}
          {el.type === 'text' ? (
            <div
              style={{
                fontFamily: el.fontFamily ?? designMD.baseFont,
                color: el.color ?? designMD.textColor,
                fontSize: el.fontSize ? `${el.fontSize}px` : '56px',
                fontWeight: el.fontWeight ?? 'bold',
                fontStyle: el.fontStyle ?? 'normal',
                textDecoration: el.textDecoration && el.textDecoration !== 'none' ? el.textDecoration : undefined,
                textShadow: `${el.shadowOffset ?? 3}px ${el.shadowOffset ?? 3}px ${el.shadowBlur ?? 6}px ${el.shadowColor ?? 'rgba(0,0,0,0.8)'}`,
                textAlign: el.textAlign ?? 'center',
                lineHeight: el.lineHeight ?? 1.2,
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                textTransform: el.textTransform ?? 'none',
                WebkitTextStroke: el.textStrokeWidth
                  ? `${el.textStrokeWidth}px ${el.textStrokeColor ?? '#000000'}`
                  : undefined,
                // Gradient text (overrides solid color)
                ...(el.textGradient ? {
                  background: el.textGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : el.textBackground ? {
                  // Text background (pill/highlight)
                  background: el.textBackground,
                  padding: `${el.textBackgroundPadding ?? 8}px ${(el.textBackgroundPadding ?? 8) * 2}px`,
                  borderRadius: `${el.textBackgroundRadius ?? 4}px`,
                  display: 'inline-block',
                } : {}),
                whiteSpace: 'pre-wrap',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {displayContent}
            </div>
          ) : el.type === 'video' ? (
            (() => {
              const videoContent = el.chromaKeyEnabled ? (
                <ChromaKeyVideo
                  src={el.content}
                  chromaKeyColor={ckColor}
                  chromaKeyTolerance={ckTolerance}
                  chromaKeySoftness={ckSoftness}
                  playbackRate={el.playbackRate}
                  style={{
                    width: '100%',
                    height: el.height ? '100%' : 'auto',
                    objectFit: el.objectFit ?? 'contain',
                    objectPosition: el.objectPosition ?? 'center center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    filter: filterStr,
                  }}
                />
              ) : (
                <Video 
                  src={el.content}
                  volume={el.volume ?? 1}
                  playbackRate={el.playbackRate ?? 1}
                  startFrom={el.trimStartSec ? Math.round(el.trimStartSec * 30) : undefined}
                  endAt={el.trimEndSec ? Math.round(el.trimEndSec * 30) : undefined}
                  style={{ 
                    width: '100%', 
                    height: el.height ? '100%' : 'auto',
                    objectFit: el.objectFit ?? 'contain',
                    objectPosition: el.objectPosition ?? 'center center', 
                    pointerEvents: 'none', 
                    userSelect: 'none',
                    filter: filterStr,
                  }}
                />
              );
              return hasContainBg ? <div style={containBgStyle}>{videoContent}</div> : videoContent;
            })()
          ) : el.type === 'shape' ? (
            /* ── Shape Element (SVG) ── */
            (() => {
              const sw = el.width ?? 25;
              const fill = el.shapeFill ?? '#ffffff';
              const stroke = el.shapeStroke ?? 'none';
              const strokeW = el.shapeStrokeWidth ?? 0;
              const cr = el.shapeCornerRadius ?? 0;
              const svgStyle: React.CSSProperties = {
                width: '100%',
                pointerEvents: 'none',
                userSelect: 'none',
                filter: filterStr,
              };
              switch (el.shapeType) {
                case 'circle':
                  return (
                    <svg viewBox="0 0 100 100" style={svgStyle}>
                      <circle cx="50" cy="50" r={48 - strokeW / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
                    </svg>
                  );
                case 'triangle':
                  return (
                    <svg viewBox="0 0 100 100" style={svgStyle}>
                      <polygon points="50,2 98,98 2,98" fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
                    </svg>
                  );
                case 'line':
                  return (
                    <svg viewBox="0 0 100 10" style={svgStyle} preserveAspectRatio="none">
                      <line x1="0" y1="5" x2="100" y2="5" stroke={stroke || fill} strokeWidth={strokeW || 3} strokeLinecap="round" />
                    </svg>
                  );
                case 'arrow':
                  return (
                    <svg viewBox="0 0 100 40" style={svgStyle} preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="80" y2="20" stroke={stroke || fill} strokeWidth={strokeW || 3} strokeLinecap="round" />
                      <polygon points="75,5 100,20 75,35" fill={stroke || fill} />
                    </svg>
                  );
                case 'star':
                  return (
                    <svg viewBox="0 0 100 100" style={svgStyle}>
                      <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
                    </svg>
                  );
                case 'rectangle':
                default:
                  return (
                    <svg viewBox="0 0 100 100" style={svgStyle}>
                      <rect x={strokeW / 2} y={strokeW / 2} width={100 - strokeW} height={100 - strokeW} rx={cr} ry={cr} fill={fill} stroke={stroke} strokeWidth={strokeW} />
                    </svg>
                  );
              }
            })()
          ) : el.isPlaceholder ? (
            /* ── Placeholder for empty media fields ── */
            <div
              style={{
                width: '100%',
                height: el.height ? `${el.height}%` : '100%',
                aspectRatio: el.height ? undefined : '16/9',
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.03)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {el.placeholderLabel && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
                  {el.placeholderLabel}
                </span>
              )}
            </div>
          ) : (
            (() => {
              const imgContent = el.chromaKeyEnabled ? (
                <ChromaKeyImage
                  src={el.content}
                  chromaKeyColor={ckColor}
                  chromaKeyTolerance={ckTolerance}
                  chromaKeySoftness={ckSoftness}
                  style={{
                    width: '100%',
                    height: el.height ? '100%' : 'auto',
                    objectFit: el.objectFit ?? 'contain',
                    objectPosition: el.objectPosition ?? 'center center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    filter: filterStr,
                  }}
                  draggable={false}
                />
              ) : (
                <Img 
                  src={el.content} 
                  style={{ 
                    width: '100%', 
                    height: el.height ? '100%' : 'auto',
                    objectFit: el.objectFit ?? 'contain',
                    objectPosition: el.objectPosition ?? 'center center', 
                    pointerEvents: 'none', 
                    userSelect: 'none',
                    filter: filterStr,
                  }} 
                  draggable={false} 
                />
              );
              return hasContainBg ? <div style={containBgStyle}>{imgContent}</div> : imgContent;
            })()
          )}

          {/* ═══ Scale Handles — only in Scale mode ═══ */}
          {isSelected && activeAction === 'scale' && (
            <>
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
                const isTop = corner.includes('top');
                const isLeft = corner.includes('left');
                const cursorH = (isTop === isLeft) ? 'nwse-resize' : 'nesw-resize';
                return (
                  <div
                    key={corner}
                    style={{
                      position: 'absolute',
                      [isTop ? 'top' : 'bottom']: -7 / currentScale,
                      [isLeft ? 'left' : 'right']: -7 / currentScale,
                      width: 14 / currentScale,
                      height: 14 / currentScale,
                      background: '#fff',
                      border: `${Math.max(1, 2 / currentScale)}px solid #8b5cf6`,
                      borderRadius: 3 / currentScale,
                      cursor: cursorH,
                      pointerEvents: 'auto',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                    onPointerDown={startScaleDrag}
                    title="Redimensionar"
                  />
                );
              })}
            </>
          )}

          {/* ═══ Rotate Handle — only in Rotate mode ═══ */}
          {isSelected && activeAction === 'rotate' && (
            <>
              {/* Connector line from element bottom to rotate handle */}
              <div
                style={{
                  position: 'absolute', bottom: -24 / currentScale, left: '50%',
                  transform: `translateX(-50%) scaleY(${1 / currentScale})`,
                  transformOrigin: 'top center',
                  width: 1, height: 20,
                  background: '#8b5cf6',
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              />
              {/* Rotate handle circle */}
              <div 
                style={{
                  position: 'absolute', bottom: -38 / currentScale, left: '50%',
                  transform: `translateX(-50%) scale(${1 / currentScale})`,
                  transformOrigin: 'top center',
                  width: 22, height: 22,
                  background: '#fff', border: '2px solid #8b5cf6',
                  borderRadius: '50%', cursor: 'grab',
                  pointerEvents: 'auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 51,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
                onPointerDown={startRotateDrag}
                title="Arrastra para rotar"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-4.24"/></svg>
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>
      )}
    </Sequence>
  );
};
