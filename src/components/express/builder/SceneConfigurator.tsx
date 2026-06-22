import React from 'react';
import { Type, Image as ImageIcon, Plus, Trash2, Zap, Clock, Layers, Sparkles, Globe, Instagram, AtSign } from 'lucide-react';
import { ExpressScene, ExpressField, SceneLayout, BrandContentPiece, DesignMD } from '../../../types';
import { FieldInspector } from '../../ui/FieldInspector';

interface SceneConfiguratorProps {
  scene: ExpressScene;
  onUpdateScene: (updated: ExpressScene) => void;
  brandContent: BrandContentPiece[];
  designMD: DesignMD;
  isVideo: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string | null) => void;
}

/** Layout options with visual icons */
const LAYOUTS: { value: SceneLayout; label: string; icon: string }[] = [
  { value: 'fullscreen-media', label: 'Pantalla completa', icon: '📸' },
  { value: 'overlay', label: 'Overlay', icon: '🔲' },
  { value: 'split', label: 'Dividido', icon: '◫' },
  { value: 'media-left', label: 'Media izq.', icon: '◧' },
  { value: 'media-right', label: 'Media der.', icon: '◨' },
  { value: 'text-only', label: 'Solo texto', icon: '📝' },
];

/** Brand variables available for insertion */
const BRAND_VARIABLES: { source: ExpressField['brandSource']; label: string; icon: React.ReactNode; type: 'text' | 'media' | 'logo' }[] = [
  { source: 'brand-name', label: 'Nombre de Marca', icon: <Type size={10} />, type: 'text' },
  { source: 'tagline', label: 'Tagline / Eslogan', icon: <Sparkles size={10} />, type: 'text' },
  { source: 'logo', label: 'Logo', icon: <Zap size={10} />, type: 'logo' },
  { source: 'instagram', label: 'Instagram', icon: <Instagram size={10} />, type: 'text' },
  { source: 'tiktok', label: 'TikTok', icon: <AtSign size={10} />, type: 'text' },
  { source: 'twitter', label: 'X / Twitter', icon: <AtSign size={10} />, type: 'text' },
  { source: 'youtube', label: 'YouTube', icon: <AtSign size={10} />, type: 'text' },
  { source: 'website', label: 'Website', icon: <Globe size={10} />, type: 'text' },
];

/**
 * SceneConfigurator — Config panel for the active scene in the Template Builder.
 * Name, type, duration, layout, editable fields, brand assets, transition, background.
 */
export const SceneConfigurator: React.FC<SceneConfiguratorProps> = ({
  scene,
  onUpdateScene,
  brandContent,
  designMD,
  isVideo,
  selectedFieldId,
  onSelectField,
}) => {
  const updateField = (fieldId: string, updates: Partial<ExpressField>) => {
    onUpdateScene({
      ...scene,
      editableFields: scene.editableFields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const addField = (type: ExpressField['type'], label: string, brandSource?: ExpressField['brandSource']) => {
    const newField: ExpressField = {
      id: `field-${Date.now()}`,
      type,
      label,
      placeholder: label,
      required: false,
      brandSource,
      position: { x: 50, y: 50, w: type === 'text' ? 80 : 60, h: type === 'text' ? 10 : 30 },
      style: {
        fontSize: type === 'text' ? 24 : undefined,
        fontWeight: type === 'text' ? 400 : undefined,
        textAlign: 'center',
        opacity: 100,
      },
    };
    onUpdateScene({ ...scene, editableFields: [...scene.editableFields, newField] });
  };

  const addBrandAsset = (asset: BrandContentPiece) => {
    const newField: ExpressField = {
      id: `field-asset-${asset.id}-${Date.now()}`,
      type: asset.type === 'custom-image' ? 'media' : 'text',
      label: asset.name,
      placeholder: asset.content.text || asset.name,
      required: false,
      brandAssetId: asset.id,
      position: { x: 50, y: 50, w: 40, h: 20 },
      style: {
        fontSize: asset.style.fontSize || 20,
        fontWeight: 600,
        textAlign: 'center',
        opacity: 100,
      },
    };
    onUpdateScene({ ...scene, editableFields: [...scene.editableFields, newField] });
  };

  const removeField = (fieldId: string) => {
    onUpdateScene({
      ...scene,
      editableFields: scene.editableFields.filter(f => f.id !== fieldId),
    });
  };

  return (
    <div className="space-y-4">
      {/* Scene name + type */}
      <div className="space-y-2">
        <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Nombre de la escena</label>
        <input
          type="text"
          value={scene.name}
          onChange={(e) => onUpdateScene({ ...scene, name: e.target.value })}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      {/* Type + Duration (video only) */}
      {isVideo && (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Tipo</label>
            <select
              value={scene.type}
              onChange={(e) => onUpdateScene({ ...scene, type: e.target.value as ExpressScene['type'] })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500/50 focus:outline-none"
            >
              <option value="intro">Intro</option>
              <option value="content">Contenido</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="w-20 space-y-1">
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock size={8} /> Duración
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={30}
                value={scene.durationSeconds}
                onChange={(e) => onUpdateScene({ ...scene, durationSeconds: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:border-violet-500/50 focus:outline-none"
              />
              <span className="text-[9px] text-neutral-500">s</span>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="space-y-1.5">
        <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
          <Layers size={8} /> Layout
        </label>
        <div className="grid grid-cols-3 gap-1">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => onUpdateScene({ ...scene, layout: l.value })}
              title={l.label}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                scene.layout === l.value
                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-neutral-800/50" />

      {/* Editable Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Campos editables</label>
          <span className="text-[8px] text-neutral-600">{scene.editableFields.length} campos</span>
        </div>

        {scene.editableFields.map(field => {
          const isSelected = selectedFieldId === field.id;
          return (
          <div
            key={field.id}
            onClick={() => onSelectField?.(field.id)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${
              isSelected
                ? 'bg-violet-500/10 border border-violet-500/40 ring-1 ring-violet-500/20'
                : 'bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600'
            }`}
          >
            <span className="text-[10px]">
              {field.type === 'text' ? '📝' : field.type === 'media' ? '📷' : '⚡'}
            </span>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value, placeholder: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-[10px] text-neutral-300 focus:outline-none"
            />
            {field.brandSource && (
              <span className="text-[7px] text-violet-400 bg-violet-500/10 px-1 py-0.5 rounded shrink-0">
                {`{${field.brandSource}}`}
              </span>
            )}
            {field.brandAssetId && (
              <span className="text-[7px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">
                Asset
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
              title="Quitar campo"
              className="text-neutral-600 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={10} />
            </button>
          </div>
          );
        })}

        {/* Field Inspector (when a field is selected) */}
        {selectedFieldId && (() => {
          const field = scene.editableFields.find(f => f.id === selectedFieldId);
          if (!field) return null;

          const brandColors = [designMD.primaryColor, designMD.secondaryColor, designMD.textColor].filter(Boolean);

          return (
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
                textAlign: field.style.textAlign as 'left' | 'center' | 'right' | undefined,
                opacity: field.style.opacity,
              } : undefined}
              onTextStyleChange={field.type === 'text' ? (style) => {
                updateField(field.id, {
                  style: { ...field.style, ...style },
                });
              } : undefined}
              fieldType={field.type as 'text' | 'media' | 'logo'}
              fieldLabel={field.label}
              brandFont={designMD.baseFont?.split(',')[0]?.replace(/"/g, '')}
              brandColors={brandColors}
            />
          );
        })()}

        {/* Add field buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => addField('text', 'Texto')}
            title="Agregar campo de texto"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-neutral-700 text-[9px] text-neutral-500 hover:border-violet-500/50 hover:text-violet-400 transition-all"
          >
            <Plus size={8} /> Texto
          </button>
          <button
            onClick={() => addField('media', 'Media')}
            title="Agregar campo de media"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-neutral-700 text-[9px] text-neutral-500 hover:border-sky-500/50 hover:text-sky-400 transition-all"
          >
            <Plus size={8} /> Media
          </button>
        </div>
      </div>

      <hr className="border-neutral-800/50" />

      {/* Brand Variables (social handles, name, etc.) */}
      <div className="space-y-2">
        <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
          <Zap size={8} className="text-violet-400" /> Variables de Marca
        </label>
        <div className="grid grid-cols-2 gap-1">
          {BRAND_VARIABLES.map(v => (
            <button
              key={v.source}
              onClick={() => addField(v.type, v.label, v.source)}
              title={`Insertar {${v.source}}`}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-[9px] text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all"
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Content Assets */}
      {brandContent.length > 0 && (
        <>
          <hr className="border-neutral-800/50" />
          <div className="space-y-2">
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <ImageIcon size={8} className="text-amber-400" /> Assets de Marca
            </label>
            <div className="grid grid-cols-2 gap-1">
              {brandContent.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => addBrandAsset(asset)}
                  title={`Insertar asset: ${asset.name} (ID: ${asset.id})`}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[9px] text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left truncate"
                >
                  {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded bg-amber-500/20 shrink-0" />
                  )}
                  <span className="truncate">{asset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <hr className="border-neutral-800/50" />

      {/* Background */}
      <div className="space-y-1.5">
        <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Fondo</label>
        <div className="flex gap-1">
          {(['brand', 'solid', 'gradient', 'media'] as const).map(bg => (
            <button
              key={bg}
              onClick={() => onUpdateScene({ ...scene, background: { type: bg } })}
              title={`Fondo: ${bg}`}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                scene.background?.type === bg
                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {bg === 'brand' ? '🎨 Marca' : bg === 'solid' ? '⬛ Sólido' : bg === 'gradient' ? '🌈 Grad' : '📷 Media'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
