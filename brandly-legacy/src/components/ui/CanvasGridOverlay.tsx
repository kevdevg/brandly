import React from 'react';

interface CanvasGridOverlayProps {
  showGrid: boolean;
  showSafeZone: boolean;
  width: number;
  height: number;
}

/**
 * CanvasGridOverlay — Renders SVG grid lines and safe zone guides on the canvas.
 * Grid: 12-column grid with horizontal thirds.
 * Safe Zone: 10% inset rectangle (title-safe area for broadcast).
 */
export const CanvasGridOverlay: React.FC<CanvasGridOverlayProps> = ({
  showGrid,
  showSafeZone,
  width,
  height,
}) => {
  if (!showGrid && !showSafeZone) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-30"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Grid lines */}
      {showGrid && (
        <g>
          {/* Vertical thirds */}
          <line x1={width / 3} y1={0} x2={width / 3} y2={height} stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={(width * 2) / 3} y1={0} x2={(width * 2) / 3} y2={height} stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 4" />
          {/* Horizontal thirds */}
          <line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 4" />
          {/* Center crosshair */}
          <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="rgba(139,92,246,0.15)" strokeWidth="0.5" />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(139,92,246,0.15)" strokeWidth="0.5" />
          {/* Center dot */}
          <circle cx={width / 2} cy={height / 2} r={3} fill="rgba(139,92,246,0.4)" />
        </g>
      )}

      {/* Safe Zone (10% inset — broadcast title-safe area) */}
      {showSafeZone && (
        <g>
          {/* Action-safe (5%) */}
          <rect
            x={width * 0.05}
            y={height * 0.05}
            width={width * 0.9}
            height={height * 0.9}
            fill="none"
            stroke="rgba(251,191,36,0.3)"
            strokeWidth="1"
            strokeDasharray="6 3"
          />
          {/* Title-safe (10%) */}
          <rect
            x={width * 0.1}
            y={height * 0.1}
            width={width * 0.8}
            height={height * 0.8}
            fill="none"
            stroke="rgba(239,68,68,0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Labels */}
          <text x={width * 0.05 + 4} y={height * 0.05 + 10} fill="rgba(251,191,36,0.5)" fontSize="8" fontFamily="monospace">ACTION SAFE 5%</text>
          <text x={width * 0.1 + 4} y={height * 0.1 + 10} fill="rgba(239,68,68,0.5)" fontSize="8" fontFamily="monospace">TITLE SAFE 10%</text>
        </g>
      )}
    </svg>
  );
};
