import React from 'react';

interface SafeZoneOverlayProps {
  visible: boolean;
}

/**
 * Displays social media safe zone guides on the canvas.
 * Shows title-safe (80%) and action-safe (90%) zones.
 */
export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 45,
      }}
    >
      {/* Title Safe (80%) */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '10%',
          right: '10%',
          bottom: '10%',
          border: '1px dashed rgba(236, 72, 153, 0.4)',
          borderRadius: 4,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: 4,
            fontSize: 8,
            color: 'rgba(236, 72, 153, 0.6)',
            fontFamily: 'monospace',
            userSelect: 'none',
          }}
        >
          Title Safe 80%
        </span>
      </div>

      {/* Action Safe (90%) */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '5%',
          right: '5%',
          bottom: '5%',
          border: '1px dashed rgba(168, 85, 247, 0.3)',
          borderRadius: 4,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: 4,
            fontSize: 8,
            color: 'rgba(168, 85, 247, 0.5)',
            fontFamily: 'monospace',
            userSelect: 'none',
          }}
        >
          Action Safe 90%
        </span>
      </div>

      {/* Center cross */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 20,
          height: 20,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(168, 85, 247, 0.2)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(168, 85, 247, 0.2)' }} />
      </div>
    </div>
  );
};
