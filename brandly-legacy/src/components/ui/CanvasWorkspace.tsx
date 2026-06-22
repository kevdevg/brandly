import React from 'react';

/**
 * CanvasWorkspace — Figma-like pasteboard component.
 *
 * Renders a workspace with:
 * - An outer pasteboard area (optional checkerboard/grid background)
 * - An inner canvas frame with overflow:hidden (clips content)
 * - An extended overlay layer for off-canvas element interaction
 *
 * The overlay extends 60% beyond the canvas in each direction, with an inner
 * reference frame that maps 0-100% to the actual canvas area.
 */

interface CanvasWorkspaceProps {
  /** Aspect ratio CSS string for the inner canvas (e.g. '9/16', '16/9', '1/1') */
  aspectRatio: string;
  /** Whether editing mode is active (shows pasteboard grid) */
  isEditing?: boolean;
  /** CSS classes for the outer workspace wrapper */
  className?: string;
  /** CSS classes for the inner canvas frame */
  canvasClassName?: string;
  /** Content rendered INSIDE the canvas — gets overflow:hidden */
  children: React.ReactNode;
  /** Content rendered in the OVERLAY layer — can extend beyond canvas */
  overlay?: React.ReactNode;
  /** Ref for the overlay's inner reference frame (for drag calculations) */
  overlayRef?: React.RefObject<HTMLDivElement>;
  /** Pointer event handlers for the extended overlay */
  onOverlayPointerMove?: (e: React.PointerEvent) => void;
  onOverlayPointerUp?: (e: React.PointerEvent) => void;
  /** Whether pointer events on the extended overlay should be enabled */
  overlayPointerEvents?: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  aspectRatio,
  isEditing = false,
  className = 'flex-1 min-h-0',
  canvasClassName = '',
  children,
  overlay,
  overlayRef,
  onOverlayPointerMove,
  onOverlayPointerUp,
  overlayPointerEvents = false,
}) => {
  return (
    <div className={`flex items-center justify-center w-full h-full relative ${className}`}>
      {/* Pasteboard grid — only visible in editing mode */}
      {isEditing && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Inner canvas container */}
      <div
        className="relative"
        style={{ height: '100%', maxHeight: '100%', aspectRatio }}
      >
        {/* Canvas frame — clips content */}
        <div
          className={`overflow-hidden relative w-full h-full ${canvasClassName}`}
        >
          {children}
        </div>

        {/* Extended overlay for off-canvas interaction */}
        {overlay && (
          <div
            className="absolute z-10"
            style={{
              top: '-60%', left: '-60%',
              width: '220%', height: '220%',
              pointerEvents: overlayPointerEvents ? 'auto' : 'none',
            }}
            onPointerMove={onOverlayPointerMove}
            onPointerUp={onOverlayPointerUp}
            onPointerCancel={onOverlayPointerUp}
          >
            {/* Inner reference frame — maps 0-100% to the actual canvas */}
            <div
              ref={overlayRef}
              className="absolute"
              style={{
                top: 'calc(60% / 2.2)',
                left: 'calc(60% / 2.2)',
                width: 'calc(100% / 2.2)',
                height: 'calc(100% / 2.2)',
              }}
            >
              {overlay}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
