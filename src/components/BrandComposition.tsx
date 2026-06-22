import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { RenderProps } from '../types';
import { useCanvasDrag } from './composition/useCanvasDrag';
import { BackgroundLayer } from './composition/BackgroundLayer';
import { BrandOverlay } from './composition/BrandOverlay';
import { CompositionElement } from './composition/CompositionElement';
import { SmartGuides } from './composition/SmartGuides';

export const BrandComposition: React.FC<RenderProps> = ({
  designMD,
  textOverlay,
  timelineElements = [],
  layers = [],
  onElementClick,
  onElementPositionChange,
  onElementContextMenu,
  onElementDoubleClick,
  onElementTransformChange,
  onElementDuplicate,
  onElementDelete,
  onElementLock,
  selectedElementId,
  activeLayerId,
  activeAction,
  brandVisibility,
  outputFormat
}) => {
  const frame = useCurrentFrame();
  
  const {
    containerRef,
    dragState,
    setDragState,
    transformDragState,
    setTransformDragState,
    tempPositions,
    guides
  } = useCanvasDrag(timelineElements, onElementPositionChange, onElementTransformChange);

  // Separate brand fullscreen videos from other elements for correct z-order
  const brandFullscreenEls = timelineElements.filter(el =>
    el.isBrandElement && (el.brandDisplayMode ?? 'fullscreen') === 'fullscreen' && el.type === 'video'
  );
  const otherElements = timelineElements.filter(el =>
    !(el.isBrandElement && (el.brandDisplayMode ?? 'fullscreen') === 'fullscreen' && el.type === 'video')
  );

  const renderElement = (el: typeof timelineElements[0]) => {
    let layer = layers.find(l => l.id === el.layerId);
    
    // Solo-aware mute: if any audio layer has isSolo, mute all other audio layers
    if (layer?.type === 'audio') {
      const anySoloActive = layers.some(l => l.type === 'audio' && l.isSolo);
      if (anySoloActive && !layer.isSolo) {
        layer = { ...layer, isMuted: true };
      }
    }

    return (
      <CompositionElement
        key={el.id}
        element={el}
        layer={layer}
        designMD={designMD}
        frame={frame}
        selectedElementId={selectedElementId ?? null}
        activeLayerId={activeLayerId ?? null}
        activeAction={activeAction ?? 'move'}
        isImageMode={outputFormat === 'image'}
        tempPositions={tempPositions}
        dragStateId={dragState?.id ?? null}
        containerRef={containerRef}
        onElementClick={onElementClick}
        onElementDoubleClick={onElementDoubleClick}
        onElementContextMenu={onElementContextMenu}
        onElementDuplicate={onElementDuplicate}
        onElementDelete={onElementDelete}
        onElementLock={onElementLock}
        onDragStart={(id, startX, startY, initialElX, initialElY) => {
          if (onElementPositionChange) {
            setDragState({ id, startX, startY, initialElX, initialElY });
          }
        }}
        onTransformStart={(id, type, startX, startY, initialScale, initialRot, centerX, centerY) => {
          setTransformDragState({ id, type, startX, startY, initialScale, initialRot, centerX, centerY });
        }}
      />
    );
  };

  const showBackground = brandVisibility?.background ?? true;

  return (
    <AbsoluteFill style={{ backgroundColor: showBackground ? designMD.secondaryColor : 'transparent' }} ref={containerRef}>
      {/* Layer 1: Background media (user-uploaded backgrounds) */}
      <BackgroundLayer timelineElements={timelineElements} layers={layers} />

      {/* Layer 2: Brand fullscreen videos (intro/outro) — BELOW logo/frame */}
      {brandFullscreenEls.map(renderElement)}

      {/* Layer 3: Brand Overlay (logo + frame) */}
      <BrandOverlay designMD={designMD} textOverlay={textOverlay} brandVisibility={brandVisibility} />

      {/* Layer 4: All other elements (text, images, non-fullscreen brand, etc.) */}
      {otherElements.map(renderElement)}

      {/* Smart Guides Overlay */}
      <SmartGuides guides={guides} />
    </AbsoluteFill>
  );
};
