import React from 'react';
import { Layers, Trash2, Lock, Eye, EyeOff, Copy, Move } from 'lucide-react';
import { TimelineElement } from '../../types';

interface MultiSelectActionsProps {
  selectedIds: Set<string>;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  clearSelection: () => void;
}

/**
 * MultiSelectActions — Shown when 2+ elements are selected.
 * Provides bulk operations on the selected set: delete, lock, hide, duplicate, align.
 */
export const MultiSelectActions: React.FC<MultiSelectActionsProps> = ({
  selectedIds,
  timelineElements,
  setTimelineElements,
  clearSelection,
}) => {
  const selectedElements = timelineElements.filter(e => selectedIds.has(e.id));
  const count = selectedElements.length;

  if (count < 2) return null;

  const allLocked = selectedElements.every(e => e.isLocked);
  const allHidden = selectedElements.every(e => e.isHidden);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Layers size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">{count} elementos seleccionados</h3>
          <p className="text-[9px] text-neutral-500">Shift+Click para añadir/quitar</p>
        </div>
      </div>

      {/* Selected list */}
      <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
        {selectedElements.map(el => (
          <div key={el.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900/50 border border-violet-500/20">
            <span className="text-[8px] text-violet-400">{el.type}</span>
            <span className="text-[8px] text-neutral-300 truncate flex-1">
              {el.elementName || el.content?.slice(0, 20) || el.type}
            </span>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => {
            setTimelineElements(prev => prev.map(e =>
              selectedIds.has(e.id) ? { ...e, isLocked: !allLocked } : e
            ));
          }}
          title={allLocked ? "Desbloquear seleccionados" : "Bloquear seleccionados"}
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
        >
          <Lock size={10} /> {allLocked ? 'Desbloquear' : 'Bloquear'}
        </button>
        <button
          onClick={() => {
            setTimelineElements(prev => prev.map(e =>
              selectedIds.has(e.id) ? { ...e, isHidden: !allHidden } : e
            ));
          }}
          title={allHidden ? "Mostrar seleccionados" : "Ocultar seleccionados"}
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 hover:text-sky-300 hover:border-sky-500/30 transition-colors"
        >
          {allHidden ? <Eye size={10} /> : <EyeOff size={10} />}
          {allHidden ? 'Mostrar' : 'Ocultar'}
        </button>
        <button
          onClick={() => {
            const copies = selectedElements
              .filter(e => !e.isBrandElement)
              .map(e => ({
                ...e,
                id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
                x: (e.x ?? 50) + 2,
                y: (e.y ?? 50) + 2,
                isBrandElement: false,
              }));
            setTimelineElements(prev => [...prev, ...copies]);
          }}
          title="Duplicar seleccionados"
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
        >
          <Copy size={10} /> Duplicar
        </button>
        <button
          onClick={() => {
            if (!confirm(`¿Eliminar ${count} elementos?`)) return;
            setTimelineElements(prev => prev.filter(e => !selectedIds.has(e.id)));
            clearSelection();
          }}
          title="Eliminar seleccionados"
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 hover:text-red-300 hover:border-red-500/30 transition-colors"
        >
          <Trash2 size={10} /> Eliminar
        </button>
      </div>

      {/* Quick align */}
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-neutral-500 mr-1">Alinear:</span>
        {[
          { label: 'Izq', x: 10 },
          { label: 'Centro', x: 50 },
          { label: 'Der', x: 90 },
        ].map(pos => (
          <button
            key={pos.label}
            onClick={() => {
              setTimelineElements(prev => prev.map(e =>
                selectedIds.has(e.id) ? { ...e, x: pos.x } : e
              ));
            }}
            title={`Alinear ${pos.label}`}
            className="px-1.5 py-0.5 rounded text-[7px] bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 transition-colors"
          >
            {pos.label}
          </button>
        ))}
      </div>

      <button
        onClick={clearSelection}
        className="w-full py-1 rounded-lg text-[9px] text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        Deseleccionar todo (Esc)
      </button>
    </div>
  );
};
