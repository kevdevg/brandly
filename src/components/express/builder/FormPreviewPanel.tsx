import React from 'react';
import {
  Zap, FileText, Hash, Film,
} from 'lucide-react';
import { TemplateField, DesignMD, CompanyProfile, ExpressScene } from '../../../types';
import { useTemplateBuilder } from '../../../context/TemplateBuilderContext';
import { TemplateFieldInput } from '../../shared/TemplateFieldInput';

/** Resolve brand variable preview text */
function resolveBrandPreview(field: TemplateField, designMD: DesignMD, company: CompanyProfile): string {
  if (!field.brandSource) return '';
  switch (field.brandSource) {
    case 'brand-name': return company.name || designMD.brandName || 'Tu Marca';
    case 'tagline': return company.tagline || '';
    case 'logo': return '(Logo de marca)';
    case 'instagram': return company.socialLinks?.instagram || '';
    case 'tiktok': return company.socialLinks?.tiktok || '';
    case 'twitter': return company.socialLinks?.x || '';
    case 'youtube': return company.socialLinks?.youtube || '';
    case 'website': return company.socialLinks?.website || '';
    default: return '';
  }
}

/**
 * FormPreviewPanel — Preview of the auto-generated form that the end-user will see in Express.
 * 
 * Shows only editable-slot fields in their formOrder, rendered as the appropriate input type.
 * Brand variables appear as read-only info rows (not editable).
 * This is the "Vista de formulario" toggle in the builder.
 *
 * Uses the shared TemplateFieldInput component in disabled mode.
 */
export const FormPreviewPanel: React.FC = () => {
  const {
    fields,
    designMD,
    company,
    templateMeta,
    editableSlotCount,
    scenes,
  } = useTemplateBuilder();

  // Detect segments
  const formSegments = scenes.filter(
    (s: ExpressScene) => (s.type === 'intro' || s.type === 'outro') && s.segmentSource === 'form'
  );
  const brandSegments = scenes.filter(
    (s: ExpressScene) => (s.type === 'intro' || s.type === 'outro') && s.segmentSource === 'brand'
  );

  const editableSlots = fields
    .filter(f => f.nature === 'editable-slot')
    .sort((a, b) => a.formOrder - b.formOrder);

  const brandVars = fields.filter(f => f.nature === 'brand-variable');

  return (
    <div className="flex-1 flex items-start justify-center bg-neutral-950 p-6 overflow-auto min-h-0">
      {/* Form card */}
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 bg-gradient-to-r from-sky-500/5 to-violet-500/5">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-sky-400" />
            <h2 className="text-sm font-bold text-white">Vista previa del formulario</h2>
          </div>
          <p className="text-[10px] text-neutral-500">
            Este es el formulario que verá quien produzca contenido con esta plantilla.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full font-medium">
              <Hash size={8} className="inline mr-0.5" />
              {editableSlotCount} campo{editableSlotCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[9px] text-neutral-500">{templateMeta.name || 'Plantilla'}</span>
          </div>
        </div>

        {/* Form fields */}
        <div className="p-6 space-y-5">
          {/* ── Form-sourced segment fields (video upload previews) ── */}
          {formSegments.length > 0 && (
            <div className="space-y-3 pb-4 border-b border-neutral-800/50 mb-4">
              <div className="flex items-center gap-2">
                <Film size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Segmentos de video</span>
              </div>
              {formSegments.map((scene: ExpressScene) => {
                const isIntro = scene.type === 'intro';
                const syntheticField: TemplateField = {
                  id: `segment-${scene.id}`,
                  nature: 'editable-slot',
                  type: 'video',
                  label: scene.segmentFieldLabel || (isIntro ? 'Video de intro' : 'Video de cierre'),
                  required: scene.segmentFieldRequired ?? true,
                  content: isIntro ? 'Video de intro' : 'Video de cierre',
                  position: { x: 50, y: 50, w: 100, h: 100 },
                  style: { opacity: 100 },
                  formOrder: isIntro ? -2 : 999,
                };
                return (
                  <TemplateFieldInput
                    key={syntheticField.id}
                    field={syntheticField}
                    value=""
                    onChange={() => {}}
                    designMD={designMD}
                    disabled
                  />
                );
              })}
            </div>
          )}

          {editableSlots.length === 0 && formSegments.length === 0 ? (
            <div className="text-center py-8">
              <Hash size={24} className="text-neutral-700 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">No hay campos editables.</p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Agrega campos desde el panel "Campos" para que aparezcan aquí.
              </p>
            </div>
          ) : editableSlots.length === 0 ? null : (
            editableSlots.map((field) => (
              <TemplateFieldInput
                key={field.id}
                field={field}
                value=""
                onChange={() => {}}
                designMD={designMD}
                disabled
              />
            ))
          )}

          {/* Brand-sourced segments (read-only info) */}
          {brandSegments.length > 0 && (
            <div className="pt-4 border-t border-neutral-800/50">
              <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1">
                <Zap size={8} /> Segmentos automáticos
              </p>
              <div className="space-y-2">
                {brandSegments.map((scene: ExpressScene) => (
                  <div
                    key={scene.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg"
                  >
                    <Film size={10} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-emerald-300 font-medium">{scene.name}</span>
                      <span className="text-[9px] text-emerald-400/50 block">
                        {scene.durationSeconds}s — desde la marca
                      </span>
                    </div>
                    <span className="text-[7px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                      auto
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand variables (read-only info) */}
          {brandVars.length > 0 && (
            <div className="pt-4 border-t border-neutral-800/50">
              <p className="text-[9px] text-violet-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1">
                <Zap size={8} /> Auto-completados desde la marca
              </p>
              <div className="space-y-2">
                {brandVars.map(field => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-violet-500/5 border border-violet-500/15 rounded-lg"
                  >
                    <Zap size={10} className="text-violet-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-violet-300 font-medium">{field.label}</span>
                      <span className="text-[9px] text-violet-400/50 block truncate">
                        {resolveBrandPreview(field, designMD, company)}
                      </span>
                    </div>
                    <span className="text-[7px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                      auto
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
