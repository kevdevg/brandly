import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Layers, Search, Video, Image as ImageIcon, Plus, ArrowRight,
  GripVertical, Pencil, Copy, Trash2, Smartphone, Monitor, Square,
  Star, Package, ChevronDown, ChevronRight,
} from 'lucide-react';
import { ExpressTemplate } from '../../types';

const ASPECTS: { value: ExpressTemplate['aspectRatio']; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: '9:16', label: '9:16', icon: <Smartphone size={14} />, desc: 'Stories · Reels' },
  { value: '16:9', label: '16:9', icon: <Monitor size={14} />, desc: 'YouTube · Web' },
  { value: '1:1', label: '1:1', icon: <Square size={14} />, desc: 'Feed · Posts' },
  { value: '4:5', label: '4:5', icon: <Smartphone size={14} />, desc: 'IG vertical' },
];

interface TemplatesPanelProps {
  templates: ExpressTemplate[];
  onSelect: (template: ExpressTemplate) => void;
  onCreateTemplate: (format: 'video' | 'image', aspect: ExpressTemplate['aspectRatio']) => void;
  onEditTemplate: (template: ExpressTemplate) => void;
  onDuplicateTemplate: (template: ExpressTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

/**
 * TemplatesPanel — Top-left panel showing a searchable, draggable grid of templates.
 */
export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  templates,
  onSelect,
  onCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(true);
  const [presetOpen, setPresetOpen] = useState(true);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const customTemplates = useMemo(() => filtered.filter(t => t.isCustom === true), [filtered]);
  const presetTemplates = useMemo(() => filtered.filter(t => !t.isCustom), [filtered]);

  // ── Close popover on click outside ──
  useEffect(() => {
    if (!popoverOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [popoverOpen]);

  // ── Close popover on Escape ──
  useEffect(() => {
    if (!popoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [popoverOpen]);

  // ── Auto-focus first interactive element when popover opens ──
  useEffect(() => {
    if (popoverOpen && popoverRef.current) {
      const first = popoverRef.current.querySelector<HTMLElement>('button, [tabindex]');
      first?.focus();
    }
  }, [popoverOpen]);

  return (
    <div className="flex-1 min-w-0 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-400" />
          <h2 className="text-sm font-bold text-white">Plantillas</h2>
          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded-full font-mono">
            {templates.length}
          </span>
        </div>
        <button
          ref={buttonRef}
          onClick={() => setPopoverOpen(prev => !prev)}
          title="Crear nueva plantilla"
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
            popoverOpen
              ? 'text-violet-300 bg-violet-500/20 border border-violet-500/40'
              : 'text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40'
          }`}
        >
          <Plus size={11} /> Nueva
        </button>
      </div>

      {/* Creation Popover */}
      {popoverOpen && (
        <CreateTemplatePopover
          ref={popoverRef}
          onCreateTemplate={(format, aspect) => {
            onCreateTemplate(format, aspect);
            setPopoverOpen(false);
          }}
          onClose={() => {
            setPopoverOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plantilla..."
            className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Grid — split into custom and preset sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">

        {/* ── Mis plantillas (custom) ── */}
        {customTemplates.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setCustomOpen(prev => !prev)}
              title={customOpen ? 'Colapsar mis plantillas' : 'Expandir mis plantillas'}
              className="flex items-center gap-1.5 w-full mb-2 group"
            >
              {customOpen ? (
                <ChevronDown size={10} className="text-neutral-500 group-hover:text-violet-400 transition-colors shrink-0" />
              ) : (
                <ChevronRight size={10} className="text-neutral-500 group-hover:text-violet-400 transition-colors shrink-0" />
              )}
              <Star size={10} className="text-violet-400 shrink-0" />
              <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 group-hover:text-violet-400 transition-colors">
                Mis plantillas
              </span>
              <span className="text-[9px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
                {customTemplates.length}
              </span>
            </button>
            {customOpen && (
              <div className="grid grid-cols-2 gap-2">
                {customTemplates.map(template => (
                  <DraggableTemplate
                    key={template.id}
                    template={template}
                    onSelect={onSelect}
                    onEditTemplate={onEditTemplate}
                    onDuplicateTemplate={onDuplicateTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separator between sections */}
        {customTemplates.length > 0 && presetTemplates.length > 0 && (
          <hr className="border-neutral-800/50 my-2" />
        )}

        {/* ── Predeterminadas (preset) ── */}
        {presetTemplates.length > 0 && (
          <div>
            <button
              onClick={() => setPresetOpen(prev => !prev)}
              title={presetOpen ? 'Colapsar predeterminadas' : 'Expandir predeterminadas'}
              className="flex items-center gap-1.5 w-full mb-2 group"
            >
              {presetOpen ? (
                <ChevronDown size={10} className="text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" />
              ) : (
                <ChevronRight size={10} className="text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" />
              )}
              <Package size={10} className="text-neutral-500 shrink-0" />
              <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors">
                Predeterminadas
              </span>
              <span className="text-[9px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
                {presetTemplates.length}
              </span>
            </button>
            {presetOpen && (
              <div className="grid grid-cols-2 gap-2">
                {presetTemplates.map(template => (
                  <DraggableTemplate
                    key={template.id}
                    template={template}
                    onSelect={onSelect}
                    onEditTemplate={onEditTemplate}
                    onDuplicateTemplate={onDuplicateTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 && search.trim() && (
          <div className="text-center py-6 text-neutral-600">
            <Search size={20} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">Sin resultados para "{search}"</p>
          </div>
        )}

        {templates.length === 0 && (
          <div className="text-center py-8 text-neutral-600">
            <Layers size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No hay plantillas creadas</p>
            <p className="text-[10px] mt-1 text-neutral-700">Haz clic en "Nueva" para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Create Template Popover ── */

const CreateTemplatePopover = React.forwardRef<
  HTMLDivElement,
  {
    onCreateTemplate: (format: 'video' | 'image', aspect: ExpressTemplate['aspectRatio']) => void;
    onClose: () => void;
  }
>(({ onCreateTemplate, onClose }, ref) => {
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'image'>('image');
  const [selectedAspect, setSelectedAspect] = useState<ExpressTemplate['aspectRatio']>('9:16');

  // Focus trap: cycle focus within the popover
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const popover = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!popover) return;

    const focusable = popover.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [ref]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Nueva plantilla"
      onKeyDown={handleKeyDown}
      className="absolute right-4 top-[44px] z-50 w-[280px] p-4 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3"
    >
      {/* Title */}
      <p className="text-sm font-bold text-white">Nueva plantilla</p>

      {/* Format selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Tipo</p>
        <div className="flex gap-1 p-0.5 bg-neutral-800/60 rounded-lg border border-neutral-700/40">
          <button
            onClick={() => setSelectedFormat('image')}
            title="Formato imagen"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              selectedFormat === 'image'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <ImageIcon size={13} /> Imagen
          </button>
          <button
            onClick={() => setSelectedFormat('video')}
            title="Formato video"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              selectedFormat === 'video'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Video size={13} /> Video
          </button>
        </div>
      </div>

      {/* Aspect ratio selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Aspecto</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ASPECTS.map(a => {
            const isSelected = selectedAspect === a.value;
            return (
              <button
                key={a.value}
                onClick={() => setSelectedAspect(a.value)}
                title={`${a.label} — ${a.desc}`}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-violet-500/60 bg-violet-950/30 text-violet-300'
                    : 'border-neutral-700/50 bg-neutral-800/40 hover:bg-neutral-800 hover:border-neutral-600/60 text-neutral-400'
                }`}
              >
                {/* Aspect ratio visual thumbnail */}
                <div
                  className={`rounded border shrink-0 transition-colors ${
                    isSelected ? 'border-violet-500/60' : 'border-neutral-600 group-hover:border-neutral-500'
                  }`}
                  style={{
                    width: a.value === '16:9' ? 28 : a.value === '1:1' ? 18 : a.value === '4:5' ? 16 : 14,
                    height: a.value === '9:16' ? 24 : a.value === '1:1' ? 18 : a.value === '4:5' ? 20 : 16,
                    backgroundColor: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  }}
                />
                <div className="text-left min-w-0">
                  <span className={`text-[10px] font-bold block transition-colors ${
                    isSelected ? 'text-violet-300' : 'text-white group-hover:text-violet-300'
                  }`}>
                    {a.label}
                  </span>
                  <span className="text-[8px] text-neutral-500 block truncate">{a.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={() => onCreateTemplate(selectedFormat, selectedAspect)}
        title="Crear plantilla con los parámetros seleccionados"
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50"
      >
        Crear plantilla <ArrowRight size={13} />
      </button>
    </div>
  );
});
CreateTemplatePopover.displayName = 'CreateTemplatePopover';

/* ── Draggable template thumbnail ── */

const DraggableTemplate: React.FC<{
  template: ExpressTemplate;
  onSelect: (t: ExpressTemplate) => void;
  onEditTemplate: (t: ExpressTemplate) => void;
  onDuplicateTemplate: (t: ExpressTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}> = ({ template, onSelect, onEditTemplate, onDuplicateTemplate, onDeleteTemplate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `template-${template.id}`,
    data: { type: 'template', template },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const isCustom = template.isCustom === true;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(template)}
      title={template.description || template.name}
      className={`
        group relative rounded-xl border overflow-hidden cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging
          ? 'border-violet-500/60 shadow-xl shadow-violet-900/30 z-50'
          : 'border-neutral-800/60 bg-neutral-950/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-900/10'
        }
      `}
    >
      {/* Preview area */}
      <div className="h-[72px] relative flex items-center justify-center bg-neutral-900/80">
        <span className="text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">
          {template.icon}
        </span>

        {/* Format badge */}
        <div className={`absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[7px] font-bold ${
          template.format === 'video'
            ? 'bg-violet-500/20 text-violet-300'
            : 'bg-sky-500/20 text-sky-300'
        }`}>
          {template.format === 'video' ? '🎬' : '🖼️'} {template.aspectRatio}
        </div>

        {/* Drag grip hint */}
        <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
          <GripVertical size={10} className="text-neutral-500" />
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 bg-neutral-950/80">
        <p className="text-[10px] font-bold text-white truncate group-hover:text-violet-300 transition-colors">
          {template.name}
        </p>
        <p className="text-[8px] text-neutral-500 truncate mt-0.5">
          {template.description || `${template.category} · ${template.scenes.length} escenas`}
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCustom && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditTemplate(template); }}
            title="Editar plantilla"
            className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 rounded transition-colors"
          >
            <Pencil size={9} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicateTemplate(template); }}
          title="Duplicar plantilla"
          className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 rounded transition-colors"
        >
          <Copy size={9} />
        </button>
        {isCustom && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
            title="Eliminar plantilla"
            className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 size={9} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * DragOverlay content for a template being dragged.
 * Used by the parent DndContext's DragOverlay.
 */
export const TemplateDragPreview: React.FC<{ template: ExpressTemplate }> = ({ template }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-800/95 border border-violet-500/50 shadow-2xl shadow-violet-900/40 backdrop-blur-sm">
    <span className="text-xl">{template.icon}</span>
    <div>
      <p className="text-xs font-bold text-white">{template.name}</p>
      <p className="text-[9px] text-violet-400">{template.format === 'video' ? '🎬 Video' : '🖼️ Imagen'} · {template.aspectRatio}</p>
    </div>
  </div>
);
