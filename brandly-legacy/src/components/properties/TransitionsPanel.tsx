import React from 'react';
import { Wand2 } from 'lucide-react';
import { DesignMD } from '../../types';

interface TransitionsPanelProps {
  designMD: DesignMD;
}

export const TransitionsPanel: React.FC<TransitionsPanelProps> = ({ designMD }) => {
  const allowedTransitions = ['none'];
  if (designMD.defaultTransitionIn && designMD.defaultTransitionIn !== 'none') allowedTransitions.push(designMD.defaultTransitionIn);
  if (designMD.defaultTransitionOut && designMD.defaultTransitionOut !== 'none' && !allowedTransitions.includes(designMD.defaultTransitionOut)) allowedTransitions.push(designMD.defaultTransitionOut);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-neutral-800">
        <h2 className="text-sm font-bold text-white mb-1">
          <Wand2 size={16} className="inline mr-2 text-violet-400 align-text-bottom"/> Transiciones (Brand)
        </h2>
        <p className="text-[11px] text-neutral-400">Transiciones aprobadas por {designMD.baseFont ? 'la marca' : 'el manual'}</p>
      </div>
      <div className="p-5 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {allowedTransitions.map(type => (
          <div 
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type }));
            }}
            className="bg-neutral-900 border border-neutral-700 hover:border-violet-500 rounded-lg p-3 text-neutral-300 hover:text-white cursor-grab active:cursor-grabbing flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-violet-900/30 text-violet-400 flex items-center justify-center">
                <Wand2 size={14} />
              </div>
              <span className="text-xs font-semibold uppercase">{type === 'none' ? 'quitar' : type}</span>
            </div>
            <span className="text-[9px] bg-violet-900 text-violet-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest text-right">{type === 'none' ? '' : 'Brand Kit'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
