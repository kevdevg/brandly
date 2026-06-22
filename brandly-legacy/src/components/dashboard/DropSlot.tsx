import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Layers, FolderOpen, X,
  Video, Image as ImageIcon,
} from 'lucide-react';
import { ExpressTemplate, CompanyProfile } from '../../types';

interface DropSlotProps {
  type: 'template' | 'brand';
  item: ExpressTemplate | CompanyProfile | null;
  onClear: () => void;
  onClick: () => void;
}

/**
 * DropSlot — A single droppable slot for either a template or brand.
 * 
 * States:
 * - Empty: dashed border, placeholder icon + text
 * - Drag hover: highlighted border, glowing background
 * - Filled: shows selected item with remove button
 */
export const DropSlot: React.FC<DropSlotProps> = ({
  type,
  item,
  onClear,
  onClick,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${type}`,
    data: { accepts: type },
  });

  const isEmpty = !item;
  const label = type === 'template' ? 'Plantilla' : 'Marca';
  const hint = type === 'template' ? 'Suelta una plantilla' : 'Suelta una marca';

  return (
    <div
      ref={setNodeRef}
      onClick={isEmpty ? onClick : undefined}
      className={`
        relative flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200 min-w-[180px] cursor-pointer
        ${isEmpty && !isOver
          ? 'border-dashed border-neutral-700/60 bg-neutral-900/30 hover:border-neutral-600 hover:bg-neutral-900/50'
          : ''
        }
        ${isEmpty && isOver
          ? 'border-dashed border-violet-500/70 bg-violet-950/30 scale-[1.02] shadow-lg shadow-violet-900/20'
          : ''
        }
        ${!isEmpty
          ? 'border-solid border-violet-500/40 bg-neutral-900/60'
          : ''
        }
      `}
      title={isEmpty ? `Haz clic o arrastra para elegir ${label.toLowerCase()}` : `${label} seleccionada`}
    >
      {isEmpty ? (
        /* ── Empty state ── */
        <div className="flex items-center gap-3 py-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'bg-violet-600/20 text-violet-400' : 'bg-neutral-800/60 text-neutral-600'
          }`}>
            {type === 'template' ? <Layers size={20} /> : <FolderOpen size={20} />}
          </div>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              isOver ? 'text-violet-400' : 'text-neutral-500'
            }`}>
              {label}
            </p>
            <p className={`text-xs transition-colors ${
              isOver ? 'text-violet-300/70' : 'text-neutral-600'
            }`}>
              {hint}
            </p>
          </div>
        </div>
      ) : type === 'template' ? (
        /* ── Filled: Template ── */
        <FilledTemplate template={item as ExpressTemplate} />
      ) : (
        /* ── Filled: Brand ── */
        <FilledBrand brand={item as CompanyProfile} />
      )}

      {/* Clear button */}
      {!isEmpty && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          title={`Quitar ${label.toLowerCase()}`}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-colors shadow-sm"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

/* ── Sub-components for filled state ── */

const FilledTemplate: React.FC<{ template: ExpressTemplate }> = ({ template }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-violet-600/15 flex items-center justify-center text-lg">
      {template.icon}
    </div>
    <div>
      <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Plantilla</p>
      <p className="text-xs font-bold text-white">{template.name}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {template.format === 'video' ? (
          <Video size={9} className="text-violet-400" />
        ) : (
          <ImageIcon size={9} className="text-sky-400" />
        )}
        <span className="text-[8px] text-neutral-500 font-mono">{template.aspectRatio}</span>
      </div>
    </div>
  </div>
);

const FilledBrand: React.FC<{ brand: CompanyProfile }> = ({ brand }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5 border"
      style={{
        backgroundColor: brand.design.secondaryColor,
        borderColor: `${brand.design.primaryColor}40`,
      }}
    >
      {brand.design.logoUrl ? (
        <img src={brand.design.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
      ) : (
        <FolderOpen size={16} className="text-neutral-400" />
      )}
    </div>
    <div>
      <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Marca</p>
      <p className="text-xs font-bold text-white">{brand.name}</p>
      <div className="flex gap-1 mt-0.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.design.primaryColor }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.design.secondaryColor }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.design.textColor }} />
      </div>
    </div>
  </div>
);
