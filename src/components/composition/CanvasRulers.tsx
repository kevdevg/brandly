import React from 'react';

interface CanvasRulersProps {
  width: number;
  height: number;
  zoom: number;
}

/**
 * CanvasRulers — Horizontal and vertical pixel rulers on canvas edges.
 * Shows tick marks every 100px with labels.
 */
export const CanvasRulers: React.FC<CanvasRulersProps> = ({ width, height, zoom }) => {
  const step = 100; // pixels between major ticks
  const hTicks = Math.ceil(width / step);
  const vTicks = Math.ceil(height / step);

  return (
    <>
      {/* Horizontal Ruler (top) */}
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: 0,
          width: '100%',
          height: 14,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {Array.from({ length: hTicks + 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * step / width) * 100}%`,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 7,
                fontFamily: 'monospace',
                color: 'rgba(161, 161, 170, 0.4)',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              {i * step}
            </span>
            <div
              style={{
                width: 1,
                height: 4,
                backgroundColor: 'rgba(161, 161, 170, 0.25)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Vertical Ruler (left) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: -22,
          width: 18,
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {Array.from({ length: vTicks + 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${(i * step / height) * 100}%`,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 7,
                fontFamily: 'monospace',
                color: 'rgba(161, 161, 170, 0.4)',
                userSelect: 'none',
                lineHeight: 1,
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
              }}
            >
              {i * step}
            </span>
            <div
              style={{
                width: 4,
                height: 1,
                backgroundColor: 'rgba(161, 161, 170, 0.25)',
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};
