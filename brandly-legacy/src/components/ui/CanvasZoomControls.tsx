import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2 } from 'lucide-react';

interface CanvasZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSetZoom?: (zoom: number) => void;
}

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

/**
 * CanvasZoomControls — Floating zoom + undo/redo controls for the canvas workspace.
 * Renders at bottom-right of the workspace with zoom percentage, undo/redo, fit, and preset buttons.
 */
export const CanvasZoomControls: React.FC<CanvasZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onUndo,
  onRedo,
  onSetZoom,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800/60 rounded-lg px-1.5 py-1 shadow-xl">
      {/* Undo/Redo */}
      {onUndo && (
        <button
          onClick={onUndo}
          title="Deshacer (⌘Z)"
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <Undo2 size={14} />
        </button>
      )}
      {onRedo && (
        <button
          onClick={onRedo}
          title="Rehacer (⌘⇧Z)"
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <Redo2 size={14} />
        </button>
      )}
      {(onUndo || onRedo) && <div className="w-px h-4 bg-neutral-800 mx-0.5" />}

      {/* Zoom controls */}
      <button
        onClick={onZoomOut}
        title="Reducir zoom (⌘-)"
        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
      >
        <ZoomOut size={14} />
      </button>
      <div className="relative">
        <button
          onClick={() => onSetZoom ? setShowPresets(!showPresets) : onZoomReset()}
          title="Click para presets de zoom"
          className="px-2 py-0.5 rounded hover:bg-neutral-800 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors min-w-[40px] text-center"
          onDoubleClick={onZoomReset}
        >
          {Math.round(zoom * 100)}%
        </button>
        {/* Zoom presets dropdown */}
        {showPresets && onSetZoom && (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-[80px]">
            {ZOOM_PRESETS.map(z => (
              <button
                key={z}
                onClick={() => { onSetZoom(z); setShowPresets(false); }}
                title={`${Math.round(z * 100)}%`}
                className={`block w-full px-3 py-1 text-[9px] font-mono text-left transition-colors ${
                  Math.abs(zoom - z) < 0.01
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onZoomIn}
        title="Aumentar zoom (⌘+)"
        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
      >
        <ZoomIn size={14} />
      </button>
      <div className="w-px h-4 bg-neutral-800 mx-0.5" />
      <button
        onClick={onFitToScreen}
        title="Ajustar al canvas"
        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
      >
        <Maximize size={14} />
      </button>
    </div>
  );
};
