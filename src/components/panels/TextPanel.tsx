import React, { useCallback } from 'react';
import { X, Type, Plus, AlignLeft, AlignCenter, Heading1, Heading2, Subtitles } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TimelineElement } from '../../types';

interface TextPanelProps {
  onClose: () => void;
}

const TEXT_PRESETS = [
  { label: 'Título', icon: <Heading1 size={14} />, content: 'Título', fontSize: 72, y: 30 },
  { label: 'Subtítulo', icon: <Heading2 size={14} />, content: 'Subtítulo', fontSize: 48, y: 50 },
  { label: 'Cuerpo', icon: <AlignLeft size={14} />, content: 'Texto de cuerpo', fontSize: 32, y: 60 },
  { label: 'Lower Third', icon: <Subtitles size={14} />, content: 'Lower Third', fontSize: 28, y: 85 },
  { label: 'Centrado', icon: <AlignCenter size={14} />, content: 'Texto Centrado', fontSize: 56, y: 50 },
];

/**
 * Panel for adding text elements. Auto-routes to a visual layer.
 */
export const TextPanel: React.FC<TextPanelProps> = ({ onClose }) => {
  const {
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    setTimelineElements,
    setSelectedElementId,
    playerRef,
    durationInFrames,
  } = useEditor();

  const addText = useCallback((content: string, fontSize?: number, y?: number) => {
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
      type: 'text',
      content,
      startFrame: currentFrame,
      endFrame: Math.min(durationInFrames, currentFrame + 100),
      x: 50,
      y: y ?? 50,
      fontSize,
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, [layers, activeLayerId, playerRef, durationInFrames, setTimelineElements, setSelectedElementId, setLayers, setActiveLayerId]);

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Type size={14} className="text-violet-400" />
          Texto
        </h3>
        <button onClick={onClose} title="Cerrar Panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {/* Quick add */}
        <button
          onClick={() => addText('Nuevo Texto')}
          title="Añadir texto rápido"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 hover:border-violet-400/60 rounded-lg transition-all text-sm font-medium"
        >
          <Plus size={14} />
          Añadir Texto
        </button>

        {/* Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Plantillas</span>
          <div className="grid gap-1.5">
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => addText(preset.content, preset.fontSize, preset.y)}
                title={`Añadir ${preset.label}`}
                className="flex items-center gap-2.5 px-3 py-2 bg-neutral-950/50 border border-neutral-800/60 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/50 transition-all text-left group"
              >
                <span className="text-neutral-500 group-hover:text-violet-400 transition-colors">{preset.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium leading-tight">{preset.label}</span>
                  <span className="text-[9px] text-neutral-600">{preset.fontSize}px</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
