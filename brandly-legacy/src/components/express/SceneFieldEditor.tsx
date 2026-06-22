import React from 'react';
import { Type, Image as ImageIcon, Upload, Zap, Clock, Layers } from 'lucide-react';
import { ExpressScene, DesignMD, SceneLayout, TemplateField } from '../../types';

interface SceneFieldEditorProps {
  scene: ExpressScene;
  fieldData: Record<string, string>;
  onFieldChange: (fieldId: string, value: string) => void;
  designMD: DesignMD;
}

/** Layout display names */
const LAYOUT_LABELS: Record<SceneLayout, string> = {
  'fullscreen-media': '📸 Pantalla completa',
  'media-left': '◧ Media izquierda',
  'media-right': '◨ Media derecha',
  'text-only': '📝 Solo texto',
  'split': '◫ Dividido',
  'overlay': '🔲 Overlay',
};

/**
 * SceneFieldEditor — Right panel showing editable fields for the active scene.
 * User fills in text and media — no video editor needed.
 * 
 * Supports both new TemplateField[] format (scene.fields) and legacy ExpressField[] (scene.editableFields).
 * When using new format, only shows editable-slot fields sorted by formOrder.
 */
export const SceneFieldEditor: React.FC<SceneFieldEditorProps> = ({
  scene,
  fieldData,
  onFieldChange,
  designMD,
}) => {
  // Prefer new TemplateField[] format; filter to only editable-slots, sort by formOrder
  const useNewFormat = scene.fields && scene.fields.length > 0;
  
  let textFields: Array<{ id: string; label: string; required: boolean; brandSource?: string; placeholder: string; style: { fontSize?: number; fontWeight?: number } }>;
  let mediaFields: Array<{ id: string; label: string; required: boolean; placeholder: string; rules?: TemplateField['rules'] }>;
  let logoFields: Array<{ id: string; label: string; brandSource?: string }>;

  if (useNewFormat) {
    const editableSlots = scene.fields!
      .filter(f => f.nature === 'editable-slot')
      .sort((a, b) => a.formOrder - b.formOrder);
    
    textFields = editableSlots
      .filter(f => f.type === 'text')
      .map(f => ({ id: f.id, label: f.label, required: f.required, placeholder: f.content || f.label, style: f.style }));
    
    mediaFields = editableSlots
      .filter(f => f.type === 'image' || f.type === 'video')
      .map(f => ({ id: f.id, label: f.label, required: f.required, placeholder: f.content || f.label, rules: f.rules }));
    
    // Brand variables shown as read-only logo/info fields
    logoFields = scene.fields!
      .filter(f => f.nature === 'brand-variable')
      .map(f => ({ id: f.id, label: f.label, brandSource: f.brandSource }));
  } else {
    textFields = scene.editableFields
      .filter(f => f.type === 'text')
      .map(f => ({ id: f.id, label: f.label, required: f.required, brandSource: f.brandSource, placeholder: f.placeholder || f.label, style: f.style }));
    
    mediaFields = scene.editableFields
      .filter(f => f.type === 'media')
      .map(f => ({ id: f.id, label: f.label, required: f.required, placeholder: f.placeholder || f.label }));
    
    logoFields = scene.editableFields
      .filter(f => f.type === 'logo')
      .map(f => ({ id: f.id, label: f.label, brandSource: f.brandSource }));
  }

  return (
    <div className="space-y-4">
      {/* Scene header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            scene.type === 'intro' || scene.type === 'outro' ? 'bg-amber-500' : 'bg-violet-500'
          }`} />
          <span className="text-sm font-semibold text-white">{scene.name}</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock size={9} /> {scene.durationSeconds}s
          </span>
          <span className="flex items-center gap-1">
            <Layers size={9} /> {LAYOUT_LABELS[scene.layout]}
          </span>
        </div>
      </div>

      {/* Text fields */}
      {textFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Type size={10} className="text-neutral-500" />
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Textos</span>
          </div>
          {textFields.map(field => {
            const isBrandVar = !!field.brandSource;
            return (
              <div key={field.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-neutral-400 font-medium">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {isBrandVar && (
                    <span className="flex items-center gap-0.5 text-[7px] text-violet-400 bg-violet-500/10 px-1 py-0.5 rounded">
                      <Zap size={7} /> auto
                    </span>
                  )}
                </div>
                {field.style.fontSize && field.style.fontSize >= 28 ? (
                  <input
                    type="text"
                    value={fieldData[field.id] || ''}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder.replace(/\{[^}]+\}/g, designMD.brandName || '')}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-violet-500/50 focus:outline-none transition-colors"
                    style={{
                      fontFamily: designMD.titleFont || designMD.baseFont,
                      fontWeight: field.style.fontWeight || 700,
                    }}
                  />
                ) : (
                  <textarea
                    value={fieldData[field.id] || ''}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder.replace(/\{[^}]+\}/g, designMD.brandName || '')}
                    rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-violet-500/50 focus:outline-none transition-colors resize-none"
                    style={{
                      fontFamily: designMD.paragraphFont || designMD.baseFont,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Media fields */}
      {mediaFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon size={10} className="text-neutral-500" />
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Media</span>
          </div>
          {mediaFields.map(field => (
            <div key={field.id} className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {fieldData[field.id] ? (
                <div className="relative group">
                  <img
                    src={fieldData[field.id]}
                    alt={field.label}
                    className="w-full h-24 object-cover rounded-lg border border-neutral-700"
                  />
                  <button
                    onClick={() => onFieldChange(field.id, '')}
                    title="Quitar media"
                    className="absolute top-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-20 bg-neutral-800/50 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-neutral-600 hover:bg-neutral-800 transition-all">
                  <Upload size={16} className="text-neutral-500 mb-1" />
                  <span className="text-[9px] text-neutral-500">{field.placeholder}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        onFieldChange(field.id, url);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Logo fields (auto from brand) */}
      {logoFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-violet-400" />
            <span className="text-[9px] text-violet-400 uppercase tracking-wider font-semibold">Marca</span>
          </div>
          {logoFields.map(field => (
            <div key={field.id} className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2">
              {designMD.logoUrl ? (
                <img src={designMD.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-neutral-800 rounded flex items-center justify-center text-[8px] text-neutral-500">Logo</div>
              )}
              <div>
                <span className="text-[10px] text-violet-300">{field.label}</span>
                <span className="text-[8px] text-violet-400/60 block">Auto desde tu marca</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
