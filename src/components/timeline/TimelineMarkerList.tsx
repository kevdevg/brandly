import React, { useState } from 'react';
import { Flag, Plus, X } from 'lucide-react';

export interface TimelineMarker {
  id: string;
  frame: number;
  label: string;
  color: string;
}

interface TimelineMarkersProps {
  markers: TimelineMarker[];
  setMarkers: React.Dispatch<React.SetStateAction<TimelineMarker[]>>;
  currentFrame: number;
  durationInFrames: number;
  fps: number;
  onSeekToFrame?: (frame: number) => void;
}

const MARKER_COLORS = ['#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];

/**
 * TimelineMarkerList — Displays and manages timeline bookmark markers.
 * Users can add markers at the current playhead position and jump to any marker.
 */
export const TimelineMarkerList: React.FC<TimelineMarkersProps> = ({
  markers,
  setMarkers,
  currentFrame,
  durationInFrames,
  fps,
  onSeekToFrame,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addMarker = () => {
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      frame: currentFrame,
      label: `Marca ${markers.length + 1}`,
      color: MARKER_COLORS[markers.length % MARKER_COLORS.length],
    };
    setMarkers(prev => [...prev, newMarker].sort((a, b) => a.frame - b.frame));
  };

  const removeMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const updateLabel = (id: string, label: string) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, label } : m));
  };

  return (
    <div className="border-t border-neutral-800/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        title="Marcadores de Timeline"
        className="w-full flex items-center justify-between px-2 py-1 text-[9px] text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <span className="flex items-center gap-1">
          <Flag size={10} />
          Marcadores ({markers.length})
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); addMarker(); }}
          title="Añadir marcador en la posición actual"
          className="text-neutral-600 hover:text-violet-400 p-0.5 rounded hover:bg-violet-500/10 transition-colors"
        >
          <Plus size={10} />
        </button>
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar">
          {markers.length === 0 && (
            <div className="text-[8px] text-neutral-600 text-center py-2">
              Sin marcadores. Clic + para añadir.
            </div>
          )}
          {markers.map(marker => (
            <div
              key={marker.id}
              className="flex items-center gap-1 group"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: marker.color }}
              />
              <button
                onClick={() => onSeekToFrame?.(marker.frame)}
                title={`Ir a frame ${marker.frame}`}
                className="flex-1 text-left text-[8px] text-neutral-400 hover:text-white truncate transition-colors"
              >
                <input
                  type="text"
                  value={marker.label}
                  onChange={(e) => updateLabel(marker.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-0 outline-none text-[8px] text-neutral-400 w-full focus:text-white"
                  title="Editar nombre del marcador"
                />
              </button>
              <span className="text-[7px] text-neutral-600 font-mono flex-shrink-0">
                {(marker.frame / fps).toFixed(1)}s
              </span>
              <button
                onClick={() => removeMarker(marker.id)}
                title="Eliminar marcador"
                className="text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0.5"
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
