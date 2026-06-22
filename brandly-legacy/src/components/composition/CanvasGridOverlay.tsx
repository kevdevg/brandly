import React from 'react';

interface CanvasGridOverlayProps {
  visible: boolean;
  cols?: number;
  rows?: number;
}

/**
 * CanvasGridOverlay — Renders a semi-transparent grid overlay on the canvas.
 * Uses CSS repeating-linear-gradient for performance (no DOM nodes per line).
 */
export const CanvasGridOverlay: React.FC<CanvasGridOverlayProps> = ({
  visible,
  cols = 6,
  rows = 6,
}) => {
  if (!visible) return null;

  const colWidth = 100 / cols;
  const rowHeight = 100 / rows;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        pointerEvents: 'none',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${colWidth}%),
          repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${rowHeight}%)
        `,
        backgroundSize: `${colWidth}% ${rowHeight}%`,
      }}
    >
      {/* Center crosshair */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: 'rgba(168,85,247,0.15)',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '1px',
        backgroundColor: 'rgba(168,85,247,0.15)',
      }} />
    </div>
  );
};
