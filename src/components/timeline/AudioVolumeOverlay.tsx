import React, { useRef, useCallback } from 'react';
import { TimelineElement } from '../../types';

interface AudioVolumeOverlayProps {
  element: TimelineElement;
  width: number;
  height: number;
  isSelected: boolean;
  onUpdateElement: (updates: Partial<TimelineElement>) => void;
}

/**
 * SVG overlay showing volume envelope (fade in/out + keyframes) on audio clips.
 * Renders a yellow line showing the volume curve with draggable fade handles.
 */
export const AudioVolumeOverlay: React.FC<AudioVolumeOverlayProps> = ({
  element,
  width,
  height,
  isSelected,
  onUpdateElement,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const clipDuration = element.endFrame - element.startFrame;
  if (clipDuration <= 0 || width <= 0) return null;

  const fadeIn = element.fadeInFrames ?? 0;
  const fadeOut = element.fadeOutFrames ?? 0;
  const baseVolume = element.volume ?? 1;
  const keyframes = element.volumeKeyframes ?? [];

  // Build envelope path points
  const points: { x: number; y: number }[] = [];

  // Start at 0 volume if fade in
  if (fadeIn > 0) {
    points.push({ x: 0, y: height });
    points.push({ x: (fadeIn / clipDuration) * width, y: height * (1 - baseVolume) });
  } else {
    points.push({ x: 0, y: height * (1 - baseVolume) });
  }

  // Volume keyframes (interpolate between them)
  if (keyframes.length > 0) {
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
    for (const kf of sorted) {
      const x = (kf.frame / clipDuration) * width;
      const y = height * (1 - kf.volume);
      points.push({ x, y });
    }
  }

  // End with fade out
  if (fadeOut > 0) {
    const fadeOutStart = ((clipDuration - fadeOut) / clipDuration) * width;
    // If there are no keyframes after the current last point at this x, add the base volume
    const lastPoint = points[points.length - 1];
    if (lastPoint.x < fadeOutStart) {
      points.push({ x: fadeOutStart, y: height * (1 - baseVolume) });
    }
    points.push({ x: width, y: height });
  } else {
    const lastPoint = points[points.length - 1];
    if (lastPoint.x < width) {
      points.push({ x: width, y: height * (1 - baseVolume) });
    }
  }

  // Build SVG path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Fill area under the curve
  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  // Fade handle drag
  const handleFadeDrag = useCallback((type: 'in' | 'out', e: React.PointerEvent) => {
    if (!isSelected) return;
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startFrames = type === 'in' ? (element.fadeInFrames ?? 0) : (element.fadeOutFrames ?? 0);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const pxPerFrame = svgRect.width / clipDuration;

    const onMove = (me: PointerEvent) => {
      const deltaPx = type === 'in' ? me.clientX - startX : startX - me.clientX;
      const deltaFrames = Math.round(deltaPx / pxPerFrame);
      const newFrames = Math.max(0, Math.min(Math.floor(clipDuration / 2), startFrames + deltaFrames));
      
      if (type === 'in') {
        onUpdateElement({ fadeInFrames: newFrames > 0 ? newFrames : undefined });
      } else {
        onUpdateElement({ fadeOutFrames: newFrames > 0 ? newFrames : undefined });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [isSelected, element, clipDuration, onUpdateElement]);

  const fadeInX = fadeIn > 0 ? (fadeIn / clipDuration) * width : 0;
  const fadeOutX = fadeOut > 0 ? ((clipDuration - fadeOut) / clipDuration) * width : width;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Fill under curve */}
      <path
        d={fillD}
        fill="rgba(250, 204, 21, 0.08)"
      />
      {/* Volume envelope line */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? 'rgba(250, 204, 21, 0.9)' : 'rgba(250, 204, 21, 0.4)'}
        strokeWidth={isSelected ? 1.5 : 1}
        vectorEffect="non-scaling-stroke"
      />

      {/* Fade In handle */}
      {isSelected && (
        <circle
          cx={fadeInX}
          cy={fadeIn > 0 ? height * (1 - baseVolume) : height * (1 - baseVolume)}
          r={4}
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth={1}
          className="pointer-events-auto cursor-ew-resize"
          onPointerDown={(e) => handleFadeDrag('in', e)}
          style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.5))' }}
        >
          <title>Arrastrar para ajustar Fade In</title>
        </circle>
      )}

      {/* Fade Out handle */}
      {isSelected && (
        <circle
          cx={fadeOutX}
          cy={fadeOut > 0 ? height * (1 - baseVolume) : height * (1 - baseVolume)}
          r={4}
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth={1}
          className="pointer-events-auto cursor-ew-resize"
          onPointerDown={(e) => handleFadeDrag('out', e)}
          style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.5))' }}
        >
          <title>Arrastrar para ajustar Fade Out</title>
        </circle>
      )}

      {/* Volume keyframe diamonds */}
      {isSelected && keyframes.map((kf, i) => {
        const cx = (kf.frame / clipDuration) * width;
        const cy = height * (1 - kf.volume);
        return (
          <g key={`vkf-${i}`} className="pointer-events-auto cursor-pointer">
            <rect
              x={cx - 3}
              y={cy - 3}
              width={6}
              height={6}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={0.5}
              transform={`rotate(45, ${cx}, ${cy})`}
              style={{ filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.6))' }}
            >
              <title>{`Volume: ${Math.round(kf.volume * 100)}% @ frame ${kf.frame}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
};
