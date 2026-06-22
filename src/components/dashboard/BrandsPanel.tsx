import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  FolderOpen, Search, Plus, Palette, CalendarDays,
  GripVertical, Briefcase, Copy, Trash2,
} from 'lucide-react';
import { CompanyProfile } from '../../types';

interface BrandsPanelProps {
  companies: CompanyProfile[];
  onSelect: (company: CompanyProfile) => void;
  onCreateBrand: () => void;
  onEditBrand: (company: CompanyProfile) => void;
  onDeleteBrand: (id: string) => void;
  onDuplicateBrand: (id: string) => void;
  onOpenContentGrid: (companyId: string) => void;
}

/**
 * BrandsPanel — Top-right panel showing a searchable, draggable grid of brand folders.
 */
export const BrandsPanel: React.FC<BrandsPanelProps> = ({
  companies,
  onSelect,
  onCreateBrand,
  onEditBrand,
  onDeleteBrand,
  onDuplicateBrand,
  onOpenContentGrid,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div className="flex-1 min-w-0 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white">Marcas</h2>
          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded-full font-mono">
            {companies.length}
          </span>
        </div>
        <button
          onClick={onCreateBrand}
          title="Crear nueva marca"
          className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 px-2 py-1 rounded-lg font-semibold transition-all"
        >
          <Plus size={11} /> Nueva
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar marca..."
            className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(company => (
            <DraggableBrand
              key={company.id}
              company={company}
              onSelect={onSelect}
              onEditBrand={onEditBrand}
              onDeleteBrand={onDeleteBrand}
              onDuplicateBrand={onDuplicateBrand}
              onOpenContentGrid={onOpenContentGrid}
            />
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-8 text-neutral-600">
            <Briefcase size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No hay marcas creadas</p>
            <p className="text-[10px] mt-1 text-neutral-700">Haz clic en "Nueva" para empezar</p>
          </div>
        )}

        {filtered.length === 0 && search.trim() && companies.length > 0 && (
          <div className="text-center py-6 text-neutral-600">
            <Search size={20} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">Sin resultados para "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Draggable brand folder ── */

const DraggableBrand: React.FC<{
  company: CompanyProfile;
  onSelect: (c: CompanyProfile) => void;
  onEditBrand: (c: CompanyProfile) => void;
  onDeleteBrand: (id: string) => void;
  onDuplicateBrand: (id: string) => void;
  onOpenContentGrid: (id: string) => void;
}> = ({ company, onSelect, onEditBrand, onDeleteBrand, onDuplicateBrand, onOpenContentGrid }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `brand-${company.id}`,
    data: { type: 'brand', company },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(company)}
      title={`${company.name}${company.industry ? ` · ${company.industry}` : ''}`}
      className={`
        group relative rounded-xl border p-3 cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging
          ? 'border-amber-500/60 shadow-xl shadow-amber-900/30 z-50 bg-neutral-900'
          : 'border-neutral-800/60 bg-neutral-950/30 hover:border-amber-500/30 hover:bg-neutral-900/60'
        }
      `}
    >
      {/* Drag grip hint */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
        <GripVertical size={10} className="text-neutral-500" />
      </div>

      {/* Brand icon (folder) */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border shrink-0"
          style={{
            backgroundColor: company.design.secondaryColor,
            borderColor: `${company.design.primaryColor}40`,
          }}
        >
          {company.design.logoUrl ? (
            <img src={company.design.logoUrl} className="max-w-full max-h-full object-contain" alt="" />
          ) : (
            <FolderOpen size={14} className="text-amber-400" />
          )}
        </div>
        <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
          {company.name}
        </p>
      </div>

      {/* Color dots */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: company.design.primaryColor }} title="Primario" />
          <div className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: company.design.secondaryColor }} title="Secundario" />
          <div className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: company.design.textColor }} title="Texto" />
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEditBrand(company); }}
          title="Editar Design Kit"
          className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 rounded transition-colors"
        >
          <Palette size={9} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenContentGrid(company.id); }}
          title="Malla de Contenidos"
          className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-fuchsia-400 rounded transition-colors"
        >
          <CalendarDays size={9} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicateBrand(company.id); }}
          title="Duplicar marca"
          className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 rounded transition-colors"
        >
          <Copy size={9} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteBrand(company.id); }}
          title="Eliminar marca"
          className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 rounded transition-colors"
        >
          <Trash2 size={9} />
        </button>
      </div>
    </div>
  );
};

/**
 * DragOverlay content for a brand being dragged.
 */
export const BrandDragPreview: React.FC<{ company: CompanyProfile }> = ({ company }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-800/95 border border-amber-500/50 shadow-2xl shadow-amber-900/40 backdrop-blur-sm">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center p-1 border"
      style={{
        backgroundColor: company.design.secondaryColor,
        borderColor: `${company.design.primaryColor}40`,
      }}
    >
      {company.design.logoUrl ? (
        <img src={company.design.logoUrl} className="max-w-full max-h-full object-contain" alt="" />
      ) : (
        <FolderOpen size={14} className="text-amber-400" />
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-white">{company.name}</p>
      <div className="flex gap-1 mt-0.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: company.design.primaryColor }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: company.design.secondaryColor }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: company.design.textColor }} />
      </div>
    </div>
  </div>
);
