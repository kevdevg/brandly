import React from 'react';
import { Lock, Unlock, Copy, Trash2 } from 'lucide-react';
import { TimelineLayer } from '../../types';

interface LayerContextMenuProps {
  layerContextMenu: { layerId: string; x: number; y: number };
  layers: TimelineLayer[];
  setLayers: React.Dispatch<React.SetStateAction<TimelineLayer[]>>;
  onToggleLock: (layerId: string) => void;
  onDuplicate: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onClose: () => void;
}

export const LayerContextMenu: React.FC<LayerContextMenuProps> = ({
  layerContextMenu,
  layers,
  setLayers,
  onToggleLock,
  onDuplicate,
  onDelete,
  onClose
}) => {
  const currentLayer = layers.find(l => l.id === layerContextMenu.layerId);

  return (
    <div 
      className="fixed z-50 w-48 bg-[#111] border border-neutral-800 rounded-xl shadow-2xl py-1 backdrop-blur-xl"
      style={{ top: layerContextMenu.y, left: layerContextMenu.x }}
      onClick={e => e.stopPropagation()}
    >
      <button 
        className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors"
        onClick={() => onToggleLock(layerContextMenu.layerId)}
      >
        {currentLayer?.isLocked ? <Unlock size={14} /> : <Lock size={14} />} 
        {currentLayer?.isLocked ? 'Desbloquear' : 'Bloquear'}
      </button>
      <button 
        className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors"
        onClick={() => onDuplicate(layerContextMenu.layerId)}
      >
        <Copy size={14} /> Duplicar Capa
      </button>
      
      <div className="h-px bg-neutral-800 my-1 mx-2"></div>
      
      <div className="px-3 py-1">
        <span className="text-[10px] text-neutral-500 font-medium tracking-wide">Color de Etiqueta</span>
        <div className="flex items-center gap-1.5 mt-1.5">
           {[
             { color: 'none', class: 'bg-transparent border border-neutral-600 hover:border-white' },
             { color: 'red', class: 'bg-rose-500' },
             { color: 'orange', class: 'bg-orange-500' },
             { color: 'yellow', class: 'bg-yellow-500' },
             { color: 'green', class: 'bg-emerald-500' },
             { color: 'blue', class: 'bg-blue-500' },
             { color: 'purple', class: 'bg-violet-500' },
             { color: 'pink', class: 'bg-pink-500' },
           ].map(lbl => (
             <button
               key={lbl.color}
               onClick={() => {
                  setLayers(layers.map(l => l.id === layerContextMenu.layerId ? { ...l, colorLabel: lbl.color === 'none' ? undefined : lbl.color } : l));
                  onClose();
               }}
               className={`w-3.5 h-3.5 rounded-full ${lbl.class} transition-all ${
                 (currentLayer?.colorLabel || 'none') === lbl.color 
                   ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-[#111] scale-110' 
                   : 'opacity-70 hover:opacity-100 hover:scale-110'
               }`}
               title={lbl.color}
             />
           ))}
        </div>
      </div>

      <div className="h-px bg-neutral-800 my-1 mx-2"></div>
      
      <button 
        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 transition-colors"
        onClick={() => onDelete(layerContextMenu.layerId)}
      >
        <Trash2 size={14} /> Eliminar Capa
      </button>
    </div>
  );
};
