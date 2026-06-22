import React from 'react';
import { Lock, Unlock, Eye, EyeOff, Trash2, Copy } from 'lucide-react';
import { TimelineElement } from '../../types';

interface BulkActionsBarProps {
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  setSelectedElementId: (id: string | null) => void;
}

/**
 * BulkActionsBar — Quick buttons for bulk operations on all user elements.
 * Lock all, unlock all, duplicate all visible, delete all unlocked, etc.
 */
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  timelineElements,
  setTimelineElements,
  setSelectedElementId,
}) => {
  const userElements = timelineElements.filter(e => !e.isBrandElement);
  const lockedCount = userElements.filter(e => e.isLocked).length;
  const hiddenCount = userElements.filter(e => e.isHidden).length;

  return (
    <div className="space-y-1.5">
      <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Acciones en Lote</span>
      <div className="flex flex-wrap gap-1">
        {/* Lock / Unlock All */}
        <button
          onClick={() => setTimelineElements(prev => prev.map(e =>
            e.isBrandElement ? e : { ...e, isLocked: true }
          ))}
          title="Bloquear todos los elementos"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
        >
          <Lock size={9} /> Todo
        </button>
        <button
          onClick={() => setTimelineElements(prev => prev.map(e =>
            e.isBrandElement ? e : { ...e, isLocked: false }
          ))}
          title="Desbloquear todos los elementos"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
        >
          <Unlock size={9} /> Todo
        </button>

        {/* Show / Hide All */}
        <button
          onClick={() => setTimelineElements(prev => prev.map(e =>
            e.isBrandElement ? e : { ...e, isHidden: false }
          ))}
          title="Mostrar todos los elementos"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-sky-300 hover:border-sky-500/30 transition-colors"
        >
          <Eye size={9} /> Mostrar
        </button>
        <button
          onClick={() => setTimelineElements(prev => prev.map(e =>
            e.isBrandElement ? e : { ...e, isHidden: true }
          ))}
          title="Ocultar todos los elementos"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-neutral-600 hover:border-neutral-600/30 transition-colors"
        >
          <EyeOff size={9} /> Ocultar
        </button>

        {/* Delete all unlocked */}
        <button
          onClick={() => {
            if (!confirm('¿Eliminar todos los elementos desbloqueados?')) return;
            setTimelineElements(prev => prev.filter(e => e.isBrandElement || e.isLocked));
            setSelectedElementId(null);
          }}
          title="Eliminar todos los elementos desbloqueados"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-red-300 hover:border-red-500/30 transition-colors"
        >
          <Trash2 size={9} /> Limpiar
        </button>

        {/* Duplicate all */}
        <button
          onClick={() => {
            setTimelineElements(prev => {
              const userEls = prev.filter(e => !e.isBrandElement && !e.isLocked);
              const copies = userEls.map(e => ({
                ...e,
                id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                x: (e.x ?? 50) + 3,
                y: (e.y ?? 50) + 3,
                isBrandElement: false,
              }));
              return [...prev, ...copies];
            });
          }}
          title="Duplicar todos los elementos desbloqueados"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
        >
          <Copy size={9} /> Duplicar
        </button>
      </div>

      {/* Summary */}
      <div className="text-[7px] text-neutral-600 flex gap-3">
        <span>{userElements.length} elementos</span>
        <span>{lockedCount} bloqueados</span>
        <span>{hiddenCount} ocultos</span>
      </div>
    </div>
  );
};
