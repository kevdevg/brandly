import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image as ImageIcon, Palette, Film, GripVertical, Copy, Layers } from 'lucide-react';
import { TimelineElement, TimelineLayer } from '../../types';

interface ImageLayersPanelProps {
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  layers: TimelineLayer[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
}

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={16} />,
  image: <ImageIcon size={16} />,
  sticker: <ImageIcon size={16} />,
  video: <Film size={16} />,
  color: <Palette size={16} />,
};

const TYPE_LABELS: Record<string, string> = {
  text: 'TEXTO',
  image: 'IMAGEN',
  sticker: 'STICKER',
  video: 'VIDEO',
  color: 'COLOR',
};

/**
 * Photoshop-style layers panel for image editing mode.
 * Features: drag reorder, visibility, opacity, lock, duplicate, delete.
 * Elements are shown in reverse order (top-most layer first).
 */
export const ImageLayersPanel: React.FC<ImageLayersPanelProps> = ({
  timelineElements,
  setTimelineElements,
  layers,
  selectedElementId,
  setSelectedElementId,
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [editingOpacityId, setEditingOpacityId] = useState<string | null>(null);

  // Reversed for display: top-most layer (last in array) shown first
  const sortedElements = [...timelineElements].reverse();

  // ─── Actions ──────────────────────────────

  const toggleVisibility = (id: string) => {
    setTimelineElements(prev => prev.map(el =>
      el.id === id ? { ...el, opacity: (el.opacity === 0 ? 1 : 0) } : el
    ));
  };

  const toggleLock = (id: string) => {
    setTimelineElements(prev => prev.map(el =>
      el.id === id ? { ...el, isLocked: !el.isLocked } : el
    ));
  };

  const setOpacity = (id: string, value: number) => {
    setTimelineElements(prev => prev.map(el =>
      el.id === id ? { ...el, opacity: value } : el
    ));
  };

  const duplicateElement = (id: string) => {
    setTimelineElements(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      const copy: TimelineElement = {
        ...el,
        id: 'el-' + Date.now(),
        x: el.x + 3,
        y: el.y + 3,
        isBrandElement: false,
      };
      const idx = prev.findIndex(e => e.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteElement = (id: string) => {
    const el = timelineElements.find(e => e.id === id);
    if (el?.isBrandElement) return;
    setTimelineElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // ─── Drag & Drop Reorder ──────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, visualIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(visualIndex));
    setDragFromIndex(visualIndex);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, visualIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(visualIndex);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetVisualIndex: number) => {
    e.preventDefault();
    const fromVisual = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(fromVisual) || fromVisual === targetVisualIndex) {
      setDragOverIndex(null);
      setDragFromIndex(null);
      return;
    }

    // Convert visual indices (reversed) to actual array indices
    const fromActual = timelineElements.length - 1 - fromVisual;
    const toActual = timelineElements.length - 1 - targetVisualIndex;

    setTimelineElements(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromActual, 1);
      next.splice(toActual, 0, moved);
      return next;
    });

    setDragOverIndex(null);
    setDragFromIndex(null);
  }, [timelineElements.length, setTimelineElements]);

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
    setDragFromIndex(null);
  }, []);

  // ─── Helpers ──────────────────────────────

  const getLabel = (el: TimelineElement): string => {
    if (el.type === 'text') {
      const preview = el.content.slice(0, 24);
      return preview.length < el.content.length ? `${preview}…` : preview;
    }
    return TYPE_LABELS[el.type] || el.type;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-neutral-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={12} className="text-neutral-500" />
          <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Capas</h3>
        </div>
        <span className="text-[10px] text-neutral-600 font-mono">{sortedElements.length}</span>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sortedElements.length === 0 ? (
          <div className="p-8 text-center text-neutral-600">
            <Layers size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-[11px] font-medium">Sin elementos</p>
            <p className="text-[10px] mt-1 text-neutral-700">Usa las herramientas para agregar capas</p>
          </div>
        ) : (
          sortedElements.map((el, visualIndex) => {
            const isSelected = selectedElementId === el.id;
            const isHidden = el.opacity === 0;
            const isLocked = el.isLocked || el.isBrandElement;
            const isDragOver = dragOverIndex === visualIndex;
            const isDragging = dragFromIndex === visualIndex;
            const showOpacity = editingOpacityId === el.id;
            const opacityValue = el.opacity ?? 1;

            return (
              <div key={el.id}>
                {/* Drop indicator */}
                {isDragOver && !isDragging && (
                  <div className="h-0.5 bg-violet-500 mx-2 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                )}

                <div
                  draggable={!isLocked}
                  onDragStart={(e) => handleDragStart(e, visualIndex)}
                  onDragOver={(e) => handleDragOver(e, visualIndex)}
                  onDrop={(e) => handleDrop(e, visualIndex)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`group flex items-stretch border-b border-neutral-800/30 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-950/50 border-l-2 border-l-violet-500'
                      : 'bg-transparent hover:bg-neutral-800/30 border-l-2 border-l-transparent'
                  } ${isDragging ? 'opacity-30' : ''} ${isHidden ? 'opacity-50' : ''}`}
                >
                  {/* Drag grip */}
                  <div className={`w-5 flex items-center justify-center shrink-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}>
                    <GripVertical size={10} className="text-neutral-700 group-hover:text-neutral-500 transition-colors" />
                  </div>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                    title={isHidden ? 'Mostrar' : 'Ocultar'}
                    className="w-6 flex items-center justify-center shrink-0 text-neutral-600 hover:text-white transition-colors"
                  >
                    {isHidden ? <EyeOff size={11} /> : <Eye size={11} className={isSelected ? 'text-violet-400' : ''} />}
                  </button>

                  {/* Thumbnail */}
                  <div className={`w-10 h-10 my-1 rounded flex items-center justify-center shrink-0 overflow-hidden ${
                    isSelected ? 'ring-1 ring-violet-500/50' : ''
                  }`}>
                    {(el.type === 'image' || el.type === 'sticker') ? (
                      <img
                        src={el.content}
                        alt=""
                        className="w-full h-full object-cover rounded"
                        draggable={false}
                      />
                    ) : el.type === 'video' ? (
                      <div className="w-full h-full bg-sky-950/50 rounded flex items-center justify-center">
                        <Film size={14} className="text-sky-400" />
                      </div>
                    ) : el.type === 'color' ? (
                      <div className="w-full h-full rounded" style={{ backgroundColor: el.content || '#000' }} />
                    ) : (
                      <div className={`w-full h-full rounded flex items-center justify-center ${
                        isSelected ? 'bg-violet-950/50' : 'bg-neutral-900'
                      }`}>
                        <span className={isSelected ? 'text-violet-400' : 'text-neutral-600'}>
                          {ELEMENT_ICONS[el.type] || <ImageIcon size={14} />}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label + type + opacity */}
                  <div className="flex-1 min-w-0 py-1.5 pl-2 flex flex-col justify-center">
                    <p className={`text-[11px] font-medium truncate leading-tight ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                      {getLabel(el)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-neutral-600 uppercase tracking-wider font-semibold">
                        {TYPE_LABELS[el.type] || el.type}
                      </span>
                      {opacityValue < 1 && opacityValue > 0 && (
                        <span className="text-[8px] text-neutral-600 font-mono">
                          {Math.round(opacityValue * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-0 px-1 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {/* Lock */}
                    {el.isBrandElement ? (
                      <span className="w-5 h-5 flex items-center justify-center text-amber-500" title="Marca (protegido)">
                        <Lock size={10} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                        title={el.isLocked ? 'Desbloquear' : 'Bloquear'}
                        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                          el.isLocked ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        {el.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                      </button>
                    )}

                    {/* Opacity toggle */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingOpacityId(showOpacity ? null : el.id); }}
                      title="Opacidad"
                      className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-mono transition-colors ${
                        showOpacity ? 'text-violet-400' : 'text-neutral-600 hover:text-neutral-300'
                      }`}
                    >
                      α
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }}
                      title="Duplicar capa"
                      className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-white transition-colors"
                    >
                      <Copy size={10} />
                    </button>

                    {/* Delete */}
                    {!el.isBrandElement && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                        title="Eliminar capa"
                        className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline opacity slider */}
                {showOpacity && (
                  <div className="px-4 py-2 bg-neutral-950/60 border-b border-neutral-800/30 flex items-center gap-3">
                    <span className="text-[9px] text-neutral-500 w-12 shrink-0">Opacidad</span>
                    <input
                      type="range"
                      min="0" max="1" step="0.01"
                      value={opacityValue}
                      onChange={(e) => setOpacity(el.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-1 accent-violet-500"
                    />
                    <span className="text-[9px] text-neutral-500 font-mono w-8 text-right">
                      {Math.round(opacityValue * 100)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="px-3 py-2 border-t border-neutral-800 shrink-0 flex items-center justify-between">
        <span className="text-[9px] text-neutral-600">
          Arrastra para reordenar
        </span>
        <span className="text-[9px] text-neutral-700 font-mono">
          z-index ↑
        </span>
      </div>
    </div>
  );
};
