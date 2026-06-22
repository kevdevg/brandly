import React from 'react';
import {
  Settings2, Tag, ToggleLeft, Type, Image as ImageIcon, Video, Pentagon,
  Zap, AlertCircle, Hash, Eye, EyeOff, ArrowLeftRight,
} from 'lucide-react';
import { TemplateField, TemplateFieldNature, TemplateFieldType, BrandSource, StickerConfig } from '../../../types';
import { useTemplateBuilder } from '../../../context/TemplateBuilderContext';
import { FieldInspector } from '../../ui/FieldInspector';
import { CollapsibleSection } from '../../ui/CollapsibleSection';
import { DEFAULT_STICKER, getPlatformIcon } from './PlatformIcons';

/** Nature display config */
const NATURE_CONFIG: Record<TemplateFieldNature, { label: string; color: string; icon: React.ReactNode }> = {
  'static': { label: 'Estático', color: '#6b7280', icon: <Pentagon size={10} /> },
  'brand-variable': { label: 'Variable de marca', color: '#a78bfa', icon: <Zap size={10} /> },
  'editable-slot': { label: 'Campo editable', color: '#38bdf8', icon: <Tag size={10} /> },
};

/** Type options */
const TYPE_OPTIONS: { value: TemplateFieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Texto', icon: <Type size={10} /> },
  { value: 'image', label: 'Imagen', icon: <ImageIcon size={10} /> },
  { value: 'video', label: 'Video', icon: <Video size={10} /> },
  { value: 'shape', label: 'Forma', icon: <Pentagon size={10} /> },
  { value: 'sticker', label: 'Sticker', icon: <Zap size={10} /> },
];

/** Brand sources */
const BRAND_SOURCES: { value: BrandSource; label: string }[] = [
  { value: 'brand-name', label: 'Nombre de Marca' },
  { value: 'tagline', label: 'Tagline' },
  { value: 'logo', label: 'Logo' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Website' },
];

/**
 * FieldConfigPanel — Right panel in the Template Builder.
 * 
 * Shows properties for the selected field, adapted by its nature.
 * Reuses FieldInspector for position editing and CollapsibleSection for grouping.
 */
export const FieldConfigPanel: React.FC = () => {
  const {
    fields,
    selectedFieldId,
    setSelectedFieldId,
    updateField,
    resolvedDesignMD,
    editableSlotCount,
    totalFieldCount,
    templateMeta,
  } = useTemplateBuilder();

  const field = fields.find(f => f.id === selectedFieldId);

  // No selection — show hint
  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center py-8">
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Selecciona un campo en el canvas o en la lista para configurarlo.
        </p>
      </div>
    );
  }

  const natureConfig = NATURE_CONFIG[field.nature];
  const brandColors = [resolvedDesignMD.primaryColor, resolvedDesignMD.secondaryColor, resolvedDesignMD.textColor].filter(Boolean);

  return (
    <div>
      {/* Header */}
      <div className="p-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-neutral-400" />
            <span className="text-sm font-semibold text-white truncate max-w-[140px]">{field.label}</span>
          </div>
          <button
            onClick={() => setSelectedFieldId(null)}
            title="Deseleccionar"
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: natureConfig.color, backgroundColor: `${natureConfig.color}15`, border: `1px solid ${natureConfig.color}30` }}
          >
            {natureConfig.icon} {natureConfig.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* ── Label ── */}
        <div className="space-y-1">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Etiqueta</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            placeholder="Nombre del campo"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-neutral-600 focus:border-violet-500/50 focus:outline-none"
          />
        </div>

        {/* ── Nature selector ── */}
        <div className="space-y-1">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Naturaleza</label>
          <div className="flex gap-1">
            {(['static', 'brand-variable', 'editable-slot'] as TemplateFieldNature[]).map(nature => {
              const cfg = NATURE_CONFIG[nature];
              const isActive = field.nature === nature;
              return (
                <button
                  key={nature}
                  onClick={() => updateField(field.id, { nature })}
                  title={cfg.label}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-medium transition-all border ${
                    isActive
                      ? 'text-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${cfg.color}15`,
                    borderColor: `${cfg.color}40`,
                    color: cfg.color,
                  } : {}}
                >
                  {cfg.icon} {nature === 'editable-slot' ? 'Campo' : nature === 'brand-variable' ? 'Auto' : 'Fijo'}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Type selector ── */}
        <div className="space-y-1">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Tipo</label>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateField(field.id, { type: opt.value })}
                title={opt.label}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  field.type === opt.value
                    ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Required toggle (editable-slot only) ── */}
        {field.nature === 'editable-slot' && (
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-neutral-400 flex items-center gap-1.5">
              <AlertCircle size={10} />
              Obligatorio
            </label>
            <button
              onClick={() => updateField(field.id, { required: !field.required })}
              title={field.required ? 'Marcar como opcional' : 'Marcar como obligatorio'}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all ${
                field.required
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700 hover:text-neutral-300'
              }`}
            >
              <ToggleLeft size={10} />
              {field.required ? 'Sí' : 'No'}
            </button>
          </div>
        )}

        {/* ── Brand source (brand-variable only) ── */}
        {field.nature === 'brand-variable' && (
          <div className="space-y-1">
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Zap size={8} className="text-violet-400" /> Fuente de datos
            </label>
            <select
              value={field.brandSource || ''}
              onChange={(e) => updateField(field.id, { brandSource: e.target.value as BrandSource })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 focus:outline-none"
            >
              <option value="">Seleccionar...</option>
              {BRAND_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Sticker config (sticker type only) ── */}
        {field.type === 'sticker' && (() => {
          const sticker: StickerConfig = field.style.sticker || DEFAULT_STICKER;
          const updateSticker = (patch: Partial<StickerConfig>) => {
            updateField(field.id, {
              style: { ...field.style, sticker: { ...sticker, ...patch } },
            });
          };
          return (
            <CollapsibleSection title="Sticker" badge={1} defaultOpen={true}>
              <div className="space-y-3">
                {/* Show icon */}
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-neutral-400 flex items-center gap-1">
                    {sticker.showIcon ? <Eye size={10} /> : <EyeOff size={10} />}
                    Mostrar ícono
                  </label>
                  <button
                    onClick={() => updateSticker({ showIcon: !sticker.showIcon })}
                    title={sticker.showIcon ? 'Ocultar ícono' : 'Mostrar ícono'}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all ${
                      sticker.showIcon
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    {sticker.showIcon ? 'Sí' : 'No'}
                  </button>
                </div>

                {/* Icon position */}
                {sticker.showIcon && (
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-neutral-400 flex items-center gap-1">
                      <ArrowLeftRight size={10} />
                      Posición ícono
                    </label>
                    <div className="flex gap-1">
                      {(['left', 'right'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => updateSticker({ iconPosition: pos })}
                          title={pos === 'left' ? 'Ícono a la izquierda' : 'Ícono a la derecha'}
                          className={`px-2 py-1 rounded text-[8px] font-medium transition-all border ${
                            sticker.iconPosition === pos
                              ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {pos === 'left' ? '← Izq' : 'Der →'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* @ prefix */}
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-neutral-400">Prefijo @</label>
                  <button
                    onClick={() => updateSticker({ showAtPrefix: !sticker.showAtPrefix })}
                    title={sticker.showAtPrefix ? 'Ocultar @' : 'Mostrar @'}
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                      sticker.showAtPrefix
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    {sticker.showAtPrefix ? '@usuario' : 'usuario'}
                  </button>
                </div>

                {/* Style: plain or pill */}
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-neutral-400">Estilo</label>
                  <div className="flex gap-1">
                    {(['plain', 'pill'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => updateSticker({ stickerStyle: style })}
                        title={style === 'plain' ? 'Texto plano' : 'Pill con fondo'}
                        className={`px-2 py-1 rounded text-[8px] font-medium transition-all border ${
                          sticker.stickerStyle === style
                            ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        {style === 'plain' ? 'Plano' : 'Pill'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-neutral-400">Gap (px)</label>
                    <span className="text-[9px] text-neutral-500 font-mono">{sticker.gap}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={16}
                    value={sticker.gap}
                    onChange={(e) => updateSticker({ gap: parseInt(e.target.value) })}
                    className="w-full accent-violet-500 h-1"
                  />
                </div>

                {/* Icon color */}
                {sticker.showIcon && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-400">Color ícono</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sticker.iconColor || resolvedDesignMD.primaryColor}
                        onChange={(e) => updateSticker({ iconColor: e.target.value })}
                        className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-[9px] text-neutral-500 font-mono">
                        {sticker.iconColor || resolvedDesignMD.primaryColor}
                      </span>
                      {sticker.iconColor && (
                        <button
                          onClick={() => updateSticker({ iconColor: undefined })}
                          title="Usar color de marca"
                          className="text-[8px] text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {/* Preview */}
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-neutral-800/60 rounded-lg border border-neutral-700/50">
                      <span style={{ color: sticker.iconColor || resolvedDesignMD.primaryColor }}>
                        {getPlatformIcon(field.brandSource, 14)}
                      </span>
                      <span className="text-[10px] text-neutral-300">Vista previa</span>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          );
        })()}

        <hr className="border-neutral-800/50" />

        {/* ── Position (FieldInspector) ── */}
        <FieldInspector
          position={field.position}
          onPositionChange={(pos) => {
            updateField(field.id, {
              position: { ...field.position, ...pos },
            });
          }}
          textStyle={field.type === 'text' ? {
            fontSize: field.style.fontSize,
            fontWeight: field.style.fontWeight,
            fontFamily: field.style.fontFamily,
            color: field.style.color,
            textAlign: field.style.textAlign,
            opacity: field.style.opacity,
            useBrandStyle: field.style.useBrandStyle,
            textRole: field.style.textRole,
          } : undefined}
          onTextStyleChange={field.type === 'text' ? (style) => {
            updateField(field.id, {
              style: { ...field.style, ...style },
            });
          } : undefined}
          fieldType={field.type === 'video' ? 'media' : field.type === 'shape' ? 'text' : field.type}
          fieldLabel={field.label}
          brandFont={resolvedDesignMD.baseFont?.split(',')[0]?.replace(/"/g, '')}
          brandColors={brandColors}
          resolvedDesignMD={resolvedDesignMD}
        />

        {/* ── Rules (editable-slot only) ── */}
        {field.nature === 'editable-slot' && (
          <CollapsibleSection title="Reglas de validación" defaultOpen={false}>
            <div className="space-y-2">
              {/* Text rules */}
              {field.type === 'text' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500">Máx. caracteres</label>
                    <input
                      type="number"
                      min={0}
                      value={field.rules?.maxChars || ''}
                      onChange={(e) => updateField(field.id, {
                        rules: { ...field.rules, maxChars: parseInt(e.target.value) || undefined },
                      })}
                      placeholder="Sin límite"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:border-violet-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-neutral-400">Multilínea</label>
                    <button
                      onClick={() => updateField(field.id, {
                        rules: { ...field.rules, multiline: !field.rules?.multiline },
                      })}
                      title="Alternar multilínea"
                      className={`text-[9px] px-2 py-1 rounded transition-all ${
                        field.rules?.multiline
                          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                      }`}
                    >
                      {field.rules?.multiline ? 'Sí' : 'No'}
                    </button>
                  </div>
                </>
              )}

              {/* Image/Video rules */}
              {(field.type === 'image' || field.type === 'video') && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500">Aspect ratio</label>
                    <input
                      type="text"
                      value={field.rules?.aspectRatio || ''}
                      onChange={(e) => updateField(field.id, {
                        rules: { ...field.rules, aspectRatio: e.target.value || undefined },
                      })}
                      placeholder="ej. 16:9"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:border-violet-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] text-neutral-500">Ancho mín.</label>
                      <input
                        type="number"
                        min={0}
                        value={field.rules?.minWidth || ''}
                        onChange={(e) => updateField(field.id, {
                          rules: { ...field.rules, minWidth: parseInt(e.target.value) || undefined },
                        })}
                        placeholder="px"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:border-violet-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] text-neutral-500">Alto mín.</label>
                      <input
                        type="number"
                        min={0}
                        value={field.rules?.minHeight || ''}
                        onChange={(e) => updateField(field.id, {
                          rules: { ...field.rules, minHeight: parseInt(e.target.value) || undefined },
                        })}
                        placeholder="px"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:border-violet-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};
