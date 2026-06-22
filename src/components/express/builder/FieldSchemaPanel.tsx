import React, { useCallback, useState } from 'react';
import {
  Plus, Type, Image as ImageIcon, Video, Pentagon, Zap,
  Trash2, GripVertical, Sparkles, Globe, Instagram, AtSign, Star, Layers,
  Eye, EyeOff, Lock, Unlock,
} from 'lucide-react';
import { TemplateField, TemplateFieldNature, BrandSource, StickerConfig } from '../../../types';
import { useTemplateBuilder } from '../../../context/TemplateBuilderContext';
import { DEFAULT_STICKER } from './PlatformIcons';

/** Brand variables available for insertion */
const BRAND_VARIABLES: { source: BrandSource; label: string; icon: React.ReactNode; fieldType: 'text' | 'image' | 'sticker' }[] = [
  { source: 'brand-name', label: 'Nombre', icon: <Type size={10} />, fieldType: 'text' },
  { source: 'tagline', label: 'Tagline', icon: <Sparkles size={10} />, fieldType: 'text' },
  { source: 'logo', label: 'Logo', icon: <Star size={10} />, fieldType: 'image' },
  { source: 'instagram', label: 'Instagram', icon: <Instagram size={10} />, fieldType: 'sticker' },
  { source: 'tiktok', label: 'TikTok', icon: <AtSign size={10} />, fieldType: 'sticker' },
  { source: 'twitter', label: 'X / Twitter', icon: <AtSign size={10} />, fieldType: 'sticker' },
  { source: 'youtube', label: 'YouTube', icon: <AtSign size={10} />, fieldType: 'sticker' },
  { source: 'website', label: 'Website', icon: <Globe size={10} />, fieldType: 'sticker' },
];

/** Type icon mapping */
function getTypeIcon(type: TemplateField['type'], size = 10): React.ReactNode {
  switch (type) {
    case 'text': return <Type size={size} />;
    case 'image': return <ImageIcon size={size} />;
    case 'video': return <Video size={size} />;
    case 'shape': return <Pentagon size={size} />;
    case 'sticker': return <Zap size={size} />;
  }
}

/** Nature badge config */
const NATURE_BADGE: Record<TemplateFieldNature, { label: string; color: string; bg: string; border: string }> = {
  'static':         { label: 'fijo',  color: '#9ca3af', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)' },
  'brand-variable': { label: 'auto',  color: '#c4b5fd', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
  'editable-slot':  { label: 'campo', color: '#7dd3fc', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.25)' },
};

/**
 * FieldSchemaPanel — Layers panel (Photoshop/Figma style) for the Template Builder.
 *
 * Photoshop convention: first row = front (highest z-index), last row = back.
 * Internally, the fields array is ordered bottom-to-top (index 0 = back, last = front).
 * The panel renders the list REVERSED so the topmost layer appears first.
 *
 * Each layer row shows: visibility toggle, lock toggle, type icon, editable name,
 * nature badge, and optional req badge.
 *
 * Bottom section: quick-add buttons for new fields and brand variables.
 */
export const FieldSchemaPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    fields,
    addField,
    removeField,
    reorderField,
    moveField,
    updateField,
    selectedFieldId,
    setSelectedFieldId,
    editableSlotCount,
    totalFieldCount,
  } = useTemplateBuilder();

  // Reversed for Photoshop convention: front layers on top
  const layersReversed = [...fields].reverse();

  // ── Drag & Drop state ──
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropDisplayIdx, setDropDisplayIdx] = useState<number | null>(null);

  const handleDragStart = useCallback((fieldId: string) => {
    setDragId(fieldId);
  }, []);

  const handleDragOver = useCallback((displayIdx: number) => {
    setDropDisplayIdx(displayIdx);
  }, []);

  const handleDrop = useCallback(() => {
    if (dragId && dropDisplayIdx !== null) {
      // Convert display index (reversed) → array index
      // Display 0 = array last, Display N = array first
      const totalLen = fields.length;
      const targetArrayIdx = totalLen - 1 - dropDisplayIdx;
      moveField(dragId, Math.max(0, Math.min(targetArrayIdx, totalLen - 1)));
    }
    setDragId(null);
    setDropDisplayIdx(null);
  }, [dragId, dropDisplayIdx, fields.length, moveField]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropDisplayIdx(null);
  }, []);

  // ── Add handlers ──
  const handleAddEditableSlot = useCallback((type: TemplateField['type'], label: string) => {
    const newId = addField({
      nature: 'editable-slot',
      type,
      label,
      required: false,
    });
    setSelectedFieldId(newId);
  }, [addField, setSelectedFieldId]);

  const handleAddBrandVariable = useCallback((source: BrandSource, label: string, type: 'text' | 'image' | 'sticker') => {
    const stickerDefaults: Partial<StickerConfig> | undefined = type === 'sticker'
      ? { ...DEFAULT_STICKER, showAtPrefix: source !== 'website' }
      : undefined;

    const newId = addField({
      nature: 'brand-variable',
      type,
      label,
      brandSource: source,
      content: `{${source}}`,
      ...(stickerDefaults ? { style: { sticker: stickerDefaults as StickerConfig } } : {}),
    });
    setSelectedFieldId(newId);
  }, [addField, setSelectedFieldId]);

  const handleAddStatic = useCallback((type: TemplateField['type'], label: string) => {
    const newId = addField({
      nature: 'static',
      type,
      label,
      content: label,
    });
    setSelectedFieldId(newId);
  }, [addField, setSelectedFieldId]);

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg">
      {/* ── Header ── */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers size={14} className="text-violet-400" />
            Capas
          </h3>
          <p className="text-[9px] text-neutral-500 mt-0.5 font-mono">
            {totalFieldCount} capa{totalFieldCount !== 1 ? 's' : ''} · {editableSlotCount} campo{editableSlotCount !== 1 ? 's' : ''}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} title="Cerrar panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors text-xs">
            ✕
          </button>
        )}
      </div>

      {/* ── Layers list (full height, scrollable) ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0">
          {layersReversed.length === 0 ? (
            <p className="text-[9px] text-neutral-600 text-center py-6 italic">
              Sin capas. Agrega elementos abajo.
            </p>
          ) : (
            layersReversed.map((field, displayIdx) => (
              <React.Fragment key={field.id}>
                {/* Drop indicator line */}
                {dropDisplayIdx === displayIdx && dragId !== field.id && (
                  <div className="h-0.5 bg-violet-500 rounded-full mx-1 my-0.5 shadow-sm shadow-violet-500/50" />
                )}
                <LayerRow
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  isDragging={dragId === field.id}
                  onSelect={() => setSelectedFieldId(field.id)}
                  onRemove={() => removeField(field.id)}
                  onToggleVisible={() => updateField(field.id, { visible: field.visible === false ? true : false })}
                  onToggleLocked={() => updateField(field.id, { locked: !field.locked })}
                  onRename={(name) => updateField(field.id, { label: name })}
                  onDragStart={() => handleDragStart(field.id)}
                  onDragOver={() => handleDragOver(displayIdx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              </React.Fragment>
            ))
          )}
          {/* Drop indicator at very bottom */}
          {dropDisplayIdx === layersReversed.length && (
            <div className="h-0.5 bg-violet-500 rounded-full mx-1 my-0.5 shadow-sm shadow-violet-500/50" />
          )}
        </div>

        <hr className="border-neutral-800/50 mx-3" />

        {/* ═══ Add Fields ═══ */}
        <div className="p-3 space-y-3">
          {/* Editable slots */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">
              Agregar campo editable
            </span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => handleAddEditableSlot('text', 'Texto')}
                title="Agregar campo de texto editable"
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-sky-500/30 text-[9px] text-sky-400/70 hover:border-sky-500/60 hover:text-sky-300 hover:bg-sky-500/5 transition-all"
              >
                <Plus size={8} /> Texto
              </button>
              <button
                onClick={() => handleAddEditableSlot('image', 'Imagen')}
                title="Agregar campo de imagen editable"
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-sky-500/30 text-[9px] text-sky-400/70 hover:border-sky-500/60 hover:text-sky-300 hover:bg-sky-500/5 transition-all"
              >
                <Plus size={8} /> Imagen
              </button>
              <button
                onClick={() => handleAddEditableSlot('video', 'Video')}
                title="Agregar campo de video editable"
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-sky-500/30 text-[9px] text-sky-400/70 hover:border-sky-500/60 hover:text-sky-300 hover:bg-sky-500/5 transition-all"
              >
                <Plus size={8} /> Video
              </button>
              <button
                onClick={() => handleAddStatic('shape', 'Forma')}
                title="Agregar elemento estático (forma)"
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-neutral-700 text-[9px] text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/50 transition-all"
              >
                <Plus size={8} /> Forma
              </button>
            </div>
          </div>

          {/* Brand variables */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Zap size={8} className="text-violet-400" /> Variables de marca
            </span>
            <div className="grid grid-cols-2 gap-1">
              {BRAND_VARIABLES.map(v => (
                <button
                  key={v.source}
                  onClick={() => handleAddBrandVariable(v.source, v.label, v.fieldType)}
                  title={`Insertar variable {${v.source}}`}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-[9px] text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all"
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LayerRow — Individual layer in Photoshop-style list with DnD
// ═══════════════════════════════════════════════════════════════

interface LayerRowProps {
  field: TemplateField;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggleVisible: () => void;
  onToggleLocked: () => void;
  onRename: (name: string) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  field,
  isSelected,
  isDragging,
  onSelect,
  onRemove,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(field.label);

  const isVisible = field.visible !== false;
  const isLocked = field.locked === true;
  const isBg = field.isBackground === true;
  const canRename = !isBg && field.nature !== 'brand-variable';
  const canDrag = !isBg;
  const badge = NATURE_BADGE[field.nature];

  const handleDoubleClick = useCallback(() => {
    if (!canRename) return;
    setRenameValue(field.label);
    setIsRenaming(true);
  }, [field.label, canRename]);

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== field.label) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, field.label, onRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setRenameValue(field.label); setIsRenaming(false); }
  }, [commitRename, field.label]);

  return (
    <div
      onClick={onSelect}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={`flex items-center gap-1 rounded-md px-1.5 py-1 cursor-pointer transition-all group ${
        isSelected
          ? 'bg-violet-500/10 border border-violet-500/40 ring-1 ring-violet-500/20'
          : 'bg-transparent border border-transparent hover:bg-neutral-800/60 hover:border-neutral-700/50'
      } ${!isVisible ? 'opacity-40' : ''} ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Drag handle */}
      {canDrag ? (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', field.id);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 shrink-0 p-0.5"
          title="Arrastrar para reordenar"
        >
          <GripVertical size={10} />
        </div>
      ) : (
        <div className="text-neutral-800 shrink-0 p-0.5" title="Capa de fondo (fija)">
          <GripVertical size={10} />
        </div>
      )}

      {/* Visibility toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
        title={isVisible ? 'Ocultar capa' : 'Mostrar capa'}
        className="text-neutral-500 hover:text-white transition-colors p-0.5 shrink-0"
      >
        {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
      </button>

      {/* Lock toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLocked(); }}
        title={isLocked ? 'Desbloquear capa' : 'Bloquear capa'}
        className={`transition-colors p-0.5 shrink-0 ${
          isLocked ? 'text-amber-400 hover:text-amber-300' : 'text-neutral-600 hover:text-neutral-400'
        }`}
      >
        {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
      </button>

      {/* Type icon */}
      <span style={{ color: badge.color }} className="shrink-0">
        {getTypeIcon(field.type)}
      </span>

      {/* Name (inline editable on double click) */}
      {isRenaming && canRename ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleRenameKeyDown}
          autoFocus
          className="flex-1 bg-neutral-800 border border-violet-500/50 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-violet-500/40 min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-[10px] text-neutral-300 truncate select-none"
          onDoubleClick={canRename ? (e) => { e.stopPropagation(); handleDoubleClick(); } : undefined}
          title={canRename ? 'Doble clic para renombrar' : 'Nombre heredado de la marca'}
        >
          {field.label}
        </span>
      )}

      {/* Badge: FONDO for background, or nature badge */}
      {isBg ? (
        <span
          className="text-[7px] px-1 py-0.5 rounded shrink-0 font-bold uppercase tracking-wider"
          style={{ color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.30)' }}
        >
          fondo
        </span>
      ) : (
        <>
          <span
            className="text-[7px] px-1 py-0.5 rounded shrink-0 font-bold uppercase tracking-wider"
            style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.border}` }}
          >
            {badge.label}
          </span>
          {field.nature === 'editable-slot' && field.required && (
            <span className="text-[7px] text-red-400 bg-red-500/10 px-1 py-0.5 rounded shrink-0 font-bold border border-red-500/20">
              req
            </span>
          )}
        </>
      )}

      {/* Delete (hover only, not for background) */}
      {!isBg && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Eliminar capa"
          className="text-neutral-600 hover:text-red-400 transition-colors p-px opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 size={9} />
        </button>
      )}
    </div>
  );
};
