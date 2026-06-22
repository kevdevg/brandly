import React, { useCallback } from 'react';
import { X, Hexagon } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TimelineElement } from '../../types';

interface ShapesPanelProps {
  onClose: () => void;
}

interface ShapeDef {
  type: TimelineElement['shapeType'];
  label: string;
  svg: React.ReactNode;
}

const SHAPES: ShapeDef[] = [
  {
    type: 'rectangle',
    label: 'Rectángulo',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <rect x="4" y="8" width="40" height="32" rx="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'circle',
    label: 'Círculo',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <circle cx="24" cy="24" r="20" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'triangle',
    label: 'Triángulo',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <polygon points="24,4 44,44 4,44" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'star',
    label: 'Estrella',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <polygon points="24,2 29,17 46,17 33,27 38,44 24,34 10,44 15,27 2,17 19,17" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'line',
    label: 'Línea',
    svg: (
      <svg viewBox="0 0 48 12" className="w-10 h-4">
        <line x1="4" y1="6" x2="44" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'arrow',
    label: 'Flecha',
    svg: (
      <svg viewBox="0 0 48 24" className="w-10 h-5">
        <line x1="4" y1="12" x2="36" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <polygon points="32,4 46,12 32,20" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * ShapesPanel — Grid of basic shapes to insert into the canvas.
 */
export const ShapesPanel: React.FC<ShapesPanelProps> = ({ onClose }) => {
  const {
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    setTimelineElements,
    setSelectedElementId,
    playerRef,
    durationInFrames,
  } = useEditor();

  const addShape = useCallback((shapeDef: ShapeDef) => {
    const currentFrame = playerRef.current?.getCurrentFrame() || 0;
    const newId = 'el-' + Date.now();

    // Find or create a visual layer
    let targetLayerId = activeLayerId;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.type === 'brand' || activeLayer.type === 'video' || activeLayer.type === 'audio') {
      let visualLayer = layers.find(l => l.type === 'visual' || l.type == null);
      if (!visualLayer) {
        visualLayer = { id: 'layer-' + Date.now(), name: 'Capa Gráfica 1', type: 'visual' };
        setLayers(prev => [...prev, visualLayer!]);
      }
      targetLayerId = visualLayer.id;
      setActiveLayerId(targetLayerId);
    }

    const newElement: TimelineElement = {
      id: newId,
      layerId: targetLayerId,
      type: 'shape',
      content: shapeDef.label,
      startFrame: currentFrame,
      endFrame: Math.min(durationInFrames, currentFrame + 100),
      x: 35,
      y: 35,
      width: 30,
      shapeType: shapeDef.type,
      shapeFill: '#ffffff',
      shapeStroke: 'none',
      shapeStrokeWidth: 0,
      shapeCornerRadius: 0,
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, [activeLayerId, layers, playerRef, durationInFrames, setLayers, setActiveLayerId, setTimelineElements, setSelectedElementId]);

  return (
    <div className="w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Hexagon size={16} className="text-violet-400" />
          <h3 className="text-sm font-bold text-white">Formas</h3>
        </div>
        <button
          onClick={onClose}
          title="Cerrar panel"
          className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Shapes Grid */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-3">Básicas</label>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.type}
              onClick={() => addShape(shape)}
              title={`Insertar ${shape.label}`}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-violet-400 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
            >
              <div className="text-neutral-500 group-hover:text-violet-400 transition-colors">
                {shape.svg}
              </div>
              <span className="text-[9px] font-medium">{shape.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
