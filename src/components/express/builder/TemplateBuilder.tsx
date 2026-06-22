import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Save, Video, Image as ImageIcon,
  Eye, FileText, Hash, Briefcase, FlaskConical, Zap,
} from 'lucide-react';
import {
  ExpressTemplate, ExpressScene, DesignMD, CompanyProfile,
  TemplateField, ExpressField,
} from '../../../types';
import {
  TemplateBuilderProvider, useTemplateBuilder, useSceneFieldsMap,
  TemplateMeta, migrateExpressFields,
} from '../../../context/TemplateBuilderContext';
import { FieldSchemaPanel } from './FieldSchemaPanel';
import { FieldConfigPanel } from './FieldConfigPanel';
import { BuilderCanvas } from './BuilderCanvas';
import { FormPreviewPanel } from './FormPreviewPanel';
import { SceneComposer } from './SceneComposer';
import { TemplateFieldInput } from '../../shared/TemplateFieldInput';
import { LivePreviewCanvas } from '../../shared/LivePreviewCanvas';

interface TemplateBuilderProps {
  company?: CompanyProfile;
  designMD?: DesignMD;
  availableBrands?: CompanyProfile[];
  onSave: (template: ExpressTemplate) => void;
  onBack: () => void;
  editingTemplate?: ExpressTemplate | null;
  initialFormat?: 'video' | 'image';
  initialAspect?: ExpressTemplate['aspectRatio'];
}


const CATEGORIES: { value: ExpressTemplate['category']; label: string; icon: string }[] = [
  { value: 'social', label: 'Social', icon: '📱' },
  { value: 'ad', label: 'Publicidad', icon: '🎯' },
  { value: 'promo', label: 'Promo', icon: '🚀' },
  { value: 'story', label: 'Historia', icon: '💬' },
  { value: 'announcement', label: 'Anuncio', icon: '📢' },
];

function createDefaultScene(format: 'video' | 'image'): ExpressScene {
  const bgType = format === 'video' ? 'video' : 'image';
  const bgLabel = format === 'video' ? 'Video de fondo' : 'Imagen de fondo';
  const now = Date.now();

  return {
    id: `scene-${now}`,
    type: 'content',
    name: 'Nueva Escena',
    durationSeconds: 5,
    layout: 'overlay',
    editableFields: [],
    fields: [
      // Background — always index 0 (bottom z-index)
      {
        id: `field-bg-${now}`,
        nature: 'editable-slot' as const,
        type: bgType,
        label: bgLabel,
        required: true,
        content: bgLabel,
        position: { x: 50, y: 50, w: 100, h: 100 },
        style: { opacity: 100 },
        formOrder: 0,
        isBackground: true,
      },
      // Title — on top
      {
        id: `field-title-${now + 1}`,
        nature: 'editable-slot' as const,
        type: 'text' as const,
        label: 'Título',
        required: true,
        content: 'Escribe aquí',
        position: { x: 50, y: 45, w: 80, h: 15 },
        style: { fontSize: 36, fontWeight: 700, textAlign: 'center' as const, opacity: 100 },
        formOrder: 1,
      },
    ],
    background: { type: 'brand' },
    transition: { type: 'fade', duration: 10 },
  };
}

/**
 * TemplateBuilder — Redesigned visual template editor.
 * 
 * Uses TemplateBuilderContext instead of EditorProvider.
 * Layout: FieldSchemaPanel (left) | Canvas or FormPreview (center) | FieldConfigPanel (right)
 */
export const TemplateBuilder: React.FC<TemplateBuilderProps> = (props) => {
  const format = props.editingTemplate?.format || props.initialFormat || 'video';

  const initialScenes = useMemo(() => {
    if (props.editingTemplate?.scenes?.length) return props.editingTemplate.scenes;
    return [createDefaultScene(format)];
  }, []);

  const initialMeta: TemplateMeta = useMemo(() => ({
    name: props.editingTemplate?.name || '',
    description: props.editingTemplate?.description || '',
    category: props.editingTemplate?.category || 'social',
    aspectRatio: props.editingTemplate?.aspectRatio || props.initialAspect || '9:16',
    format,
    usesBrandAudio: props.editingTemplate?.usesBrandAudio ?? true,
  }), []);

  return (
    <TemplateBuilderProvider
      designMD={props.designMD}
      company={props.company}
      availableBrands={props.availableBrands}
      initialScenes={initialScenes}
      initialMeta={initialMeta}
    >
      <TemplateBuilderInner
        onSave={props.onSave}
        onBack={props.onBack}
        editingTemplate={props.editingTemplate}
      />
    </TemplateBuilderProvider>
  );
};

/* ═══════════════════════════════════════════════════════════════
 * Inner component — lives inside TemplateBuilderProvider
 * ═══════════════════════════════════════════════════════════════ */

interface InnerProps {
  onSave: (template: ExpressTemplate) => void;
  onBack: () => void;
  editingTemplate?: ExpressTemplate | null;
}

const TemplateBuilderInner: React.FC<InnerProps> = ({
  onSave,
  onBack,
  editingTemplate,
}) => {
  const {
    scenes,
    setScenes,
    activeSceneId,
    setActiveSceneId,
    activeScene,
    viewMode,
    setViewMode,
    templateMeta,
    setTemplateMeta,
    editableSlotCount,
    totalFieldCount,
    selectedFieldId,
    previewBrand,
    setPreviewBrand,
    availableBrands,
    resolvedDesignMD,
    resolvedCompany,
    fields,
    testFieldData,
    setTestFieldData,
    testMediaFits,
    setTestMediaFits,
    testContainBgColors,
    setTestContainBgColors,
    // Segment management
    addSegment,
    removeSegment,
    updateSegment,
    introScene,
    outroScene,
  } = useTemplateBuilder();

  const sceneFieldsMap = useSceneFieldsMap();

  const [nameError, setNameError] = useState(false);

  // ── Scene callbacks ──
  const handleAddScene = useCallback(() => {
    const newScene = createDefaultScene(templateMeta.format);
    setScenes(prev => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  }, [setScenes, setActiveSceneId, templateMeta.format]);

  const handleRemoveScene = useCallback((sceneId: string) => {
    setScenes(prev => {
      const next = prev.filter(s => s.id !== sceneId);
      if (activeSceneId === sceneId) {
        setActiveSceneId(next[0]?.id || null);
      }
      return next;
    });
  }, [activeSceneId, setScenes, setActiveSceneId]);

  const handleUpdateScene = useCallback((updated: ExpressScene) => {
    setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, [setScenes]);

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!templateMeta.name.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 3000);
      return;
    }

    // Convert all scene fields back to ExpressField format for backward compat
    const updatedScenes = scenes.map(scene => {
      const templateFields = sceneFieldsMap[scene.id] || [];
      return {
        ...scene,
        fields: templateFields,
        editableFields: templateFieldsToExpressFields(templateFields),
      };
    });

    const template: ExpressTemplate = {
      id: editingTemplate?.id || `tpl-${Date.now()}`,
      name: templateMeta.name,
      description: templateMeta.description,
      category: templateMeta.category,
      icon: CATEGORIES.find(c => c.value === templateMeta.category)?.icon || '📐',
      aspectRatio: templateMeta.aspectRatio,
      format: templateMeta.format,
      scenes: updatedScenes,
      usesBrandAudio: templateMeta.format === 'video',
      isCustom: true,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
    };


    onSave(template);
  }, [templateMeta, scenes, sceneFieldsMap, editingTemplate, onSave]);

  // ── Build a temporary ExpressTemplate from current state (for LivePreviewCanvas) ──
  const buildCurrentTemplate = useCallback((): ExpressTemplate => {
    const updatedScenes = scenes.map(scene => {
      const templateFields = sceneFieldsMap[scene.id] || [];
      return {
        ...scene,
        fields: templateFields,
        editableFields: templateFieldsToExpressFields(templateFields),
      };
    });
    return {
      id: editingTemplate?.id || 'tpl-preview',
      name: templateMeta.name || 'Preview',
      description: templateMeta.description,
      category: templateMeta.category,
      icon: CATEGORIES.find(c => c.value === templateMeta.category)?.icon || '📐',
      aspectRatio: templateMeta.aspectRatio,
      format: templateMeta.format,
      scenes: updatedScenes,
      usesBrandAudio: false,
      isCustom: true,
    };
  }, [templateMeta, scenes, sceneFieldsMap, editingTemplate]);

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950">

      {/* ── Left: Field Schema Panel (full height) ── */}
      <FieldSchemaPanel />

      {/* ── Center: Canvas + Scene Composer ── */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Top bar — all metadata inline */}
        <div className="h-11 flex items-center gap-2 px-3 border-b border-neutral-800/60 shrink-0 bg-neutral-950/80 backdrop-blur-sm z-10">
          {/* Left: back */}
          <button
            onClick={onBack}
            title="Volver a plantillas"
            className="text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft size={14} />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-800 shrink-0" />

          {/* Name — inline editable */}
          <input
            type="text"
            value={templateMeta.name}
            onChange={(e) => { setTemplateMeta(prev => ({ ...prev, name: e.target.value })); setNameError(false); }}
            placeholder="Nombre de plantilla..."
            className={`bg-transparent border-none text-sm font-semibold text-white placeholder-neutral-600 focus:outline-none min-w-0 w-40 truncate transition-colors ${
              nameError ? 'text-red-400 placeholder-red-500/50' : ''
            }`}
          />

          {/* Counter badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 shrink-0">
            <Hash size={8} className="text-sky-400" />
            <span className="text-[8px] text-sky-300 font-mono">
              {editableSlotCount}/{totalFieldCount}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Center: View mode toggle + aspect + format */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View mode toggle */}
            <div className="flex items-center bg-neutral-800/60 rounded-lg border border-neutral-700/50 p-0.5">
              <button
                onClick={() => setViewMode('design')}
                title="Vista de diseño"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all ${
                  viewMode === 'design'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Eye size={10} /> Diseño
              </button>
              <button
                onClick={() => setViewMode('form-preview')}
                title="Vista de formulario"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all ${
                  viewMode === 'form-preview'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <FileText size={10} /> Formulario
              </button>
              <button
                onClick={() => setViewMode('test-data')}
                title="Probar con datos de ejemplo"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all ${
                  viewMode === 'test-data'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <FlaskConical size={10} /> Probar
              </button>
            </div>

            {/* Brand preview selector */}
            <div className="flex items-center bg-neutral-800/60 rounded-lg border border-neutral-700/50 p-0.5">
              <Briefcase size={10} className={previewBrand ? 'text-violet-400 ml-1.5' : 'text-neutral-500 ml-1.5'} />
              <select
                value={previewBrand?.id ?? ''}
                onChange={(e) => {
                  const brand = availableBrands.find(b => b.id === e.target.value) ?? null;
                  setPreviewBrand(brand);
                }}
                title="Ver con marca"
                className="bg-transparent text-[9px] font-medium text-neutral-300 border-none focus:outline-none cursor-pointer px-1 py-1 appearance-none pr-4"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
              >
                <option value="">Sin marca</option>
                {availableBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Aspect ratio */}
            <span className="text-[10px] font-bold text-neutral-400">
              {templateMeta.aspectRatio}
            </span>

            {/* Format badge */}
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
              templateMeta.format === 'video'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
            }`}>
              {templateMeta.format === 'video' ? <Video size={9} /> : <ImageIcon size={9} />}
              {templateMeta.format === 'video' ? 'VIDEO' : 'IMG'}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-800 shrink-0" />

          {/* Right: category + save */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Category pills (compact) */}
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setTemplateMeta(prev => ({ ...prev, category: c.value }))}
                title={c.label}
                className={`px-1.5 py-0.5 rounded text-[8px] transition-all border ${
                  templateMeta.category === c.value
                    ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                    : 'bg-transparent border-transparent text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {c.icon}
              </button>
            ))}

            {/* Save button */}
            <button
              onClick={handleSave}
              title={!templateMeta.name.trim() ? 'Dale un nombre primero' : 'Guardar plantilla'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-[10px] font-semibold transition-all shadow-lg ${
                !templateMeta.name.trim()
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
              }`}
            >
              <Save size={12} />
              Guardar
            </button>
          </div>
        </div>

        {/* Canvas row: canvas + optional config panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Canvas / Form Preview / Test Data */}
          <div className="flex-1 min-w-0 flex flex-col">
            {viewMode === 'design' ? (
              <BuilderCanvas />
            ) : viewMode === 'form-preview' ? (
              <FormPreviewPanel />
            ) : (
              /* test-data mode: split form + live preview */
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Test data form */}
                <TestDataFormPanel />
                {/* Live Remotion preview */}
                <div className="flex-1 min-w-0 bg-neutral-950 relative">
                  {/* Subtle grid background */}
                  <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
                  />
                  <LivePreviewCanvas
                    template={buildCurrentTemplate()}
                    fieldData={testFieldData}
                    brand={resolvedCompany}
                    designMD={resolvedDesignMD}
                    mediaFits={testMediaFits}
                    containBgColors={testContainBgColors}
                    activeSceneId={activeSceneId}
                    onSceneChange={setActiveSceneId}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Field Config Panel (design/form-preview modes only, not in segment mode) */}
          {selectedFieldId && viewMode !== 'test-data' && !activeScene?.segmentSource && (
            <aside className="w-64 bg-neutral-900 border-l border-neutral-800/60 shrink-0 overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <FieldConfigPanel />
            </aside>
          )}
        </div>

        {/* Scene Composer (video only) — always full width below canvas row */}
        {templateMeta.format === 'video' && (
          <div className="shrink-0 p-3 border-t border-neutral-800/60 bg-neutral-900/50">
          <SceneComposer
              scenes={scenes}
              activeSceneId={activeSceneId}
              onSelectScene={setActiveSceneId}
              onAddScene={handleAddScene}
              onRemoveScene={handleRemoveScene}
              designMD={resolvedDesignMD}
              usesBrandAudio={templateMeta.usesBrandAudio}
              format={templateMeta.format}
              onAddSegment={addSegment}
              onRemoveSegment={removeSegment}
              onUpdateSegment={updateSegment}
              previewBrand={previewBrand}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Helper: Convert TemplateField[] to legacy ExpressField[] for backward compat ──

function templateFieldsToExpressFields(fields: TemplateField[]): ExpressField[] {
  return fields.map((f): ExpressField => ({
    id: f.id,
    type: f.type === 'video' ? 'media' : f.type === 'image' ? (f.brandSource === 'logo' ? 'logo' : 'media') : f.type === 'shape' ? 'shape' : 'text',
    label: f.label,
    placeholder: f.content || f.label,
    required: f.required,
    brandSource: f.brandSource,
    brandAssetId: f.brandAssetId,
    position: { x: f.position.x, y: f.position.y, w: f.position.w, h: f.position.h },
    style: {
      fontSize: f.style.fontSize,
      fontWeight: f.style.fontWeight,
      fontFamily: f.style.fontFamily,
      textAlign: f.style.textAlign,
      color: f.style.color,
      opacity: f.style.opacity,
      shapeType: f.style.shapeType,
      shapeFill: f.style.shapeFill,
      shapeStroke: f.style.shapeStroke,
      shapeStrokeWidth: f.style.shapeStrokeWidth,
      shapeCornerRadius: f.style.shapeCornerRadius,
    },
  }));
}

// ── TestDataFormPanel — Form for entering test data in test-data view mode ──

/** Resolve brand variable preview for read-only display */
function resolveBrandTestValue(field: TemplateField, company: CompanyProfile, designMD: DesignMD): string {
  if (!field.brandSource) return '';
  switch (field.brandSource) {
    case 'brand-name': return company.name || designMD.brandName || '';
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

const TestDataFormPanel: React.FC = () => {
  const {
    fields,
    scenes,
    activeSceneId,
    setActiveSceneId,
    resolvedDesignMD: designMD,
    resolvedCompany: company,
    testFieldData,
    setTestFieldData,
    testMediaFits,
    setTestMediaFits,
    testContainBgColors,
    setTestContainBgColors,
  } = useTemplateBuilder();

  const sceneFieldsMap = useSceneFieldsMap();

  // Get all editable slots across all scenes
  const allEditableSlots = useMemo(() => {
    const slots: { field: TemplateField; sceneId: string; sceneName: string }[] = [];
    for (const scene of scenes) {
      const sceneFields = sceneFieldsMap[scene.id] || [];
      for (const f of sceneFields) {
        if (f.nature === 'editable-slot') {
          slots.push({ field: f, sceneId: scene.id, sceneName: scene.name });
        }
      }
    }
    return slots.sort((a, b) => a.field.formOrder - b.field.formOrder);
  }, [scenes, sceneFieldsMap]);

  const brandVars = useMemo(() => {
    const vars: TemplateField[] = [];
    for (const scene of scenes) {
      const sceneFields = sceneFieldsMap[scene.id] || [];
      for (const f of sceneFields) {
        if (f.nature === 'brand-variable') vars.push(f);
      }
    }
    return vars;
  }, [scenes, sceneFieldsMap]);

  // Group by scene
  const sceneGroups = useMemo(() => {
    const groups: { sceneId: string; sceneName: string; fields: typeof allEditableSlots }[] = [];
    const seen = new Set<string>();
    for (const slot of allEditableSlots) {
      if (!seen.has(slot.sceneId)) {
        seen.add(slot.sceneId);
        groups.push({
          sceneId: slot.sceneId,
          sceneName: slot.sceneName,
          fields: allEditableSlots.filter(s => s.sceneId === slot.sceneId),
        });
      }
    }
    return groups;
  }, [allEditableSlots]);

  const isMultiScene = sceneGroups.length > 1;

  return (
    <div className="w-[360px] shrink-0 flex flex-col border-r border-neutral-800/60 bg-neutral-950/95 backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical size={13} className="text-emerald-400" />
          <h2 className="text-xs font-bold text-white">Datos de prueba</h2>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
            {allEditableSlots.length} campo{allEditableSlots.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">
          Llena los campos para ver cómo se vería tu plantilla con datos reales.
        </p>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
        {allEditableSlots.length === 0 ? (
          <div className="text-center py-8">
            <FlaskConical size={24} className="text-neutral-700 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">No hay campos editables para probar.</p>
          </div>
        ) : isMultiScene ? (
          sceneGroups.map(group => (
            <div key={group.sceneId} className="space-y-3">
              <button
                onClick={() => setActiveSceneId(group.sceneId)}
                title={`Ir a escena: ${group.sceneName}`}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                  activeSceneId === group.sceneId
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-800/50 bg-neutral-900/30 hover:border-neutral-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  activeSceneId === group.sceneId ? 'bg-emerald-500' : 'bg-neutral-600'
                }`} />
                <span className="text-[11px] font-semibold text-white flex-1">{group.sceneName}</span>
                <span className="text-[9px] text-neutral-500">{group.fields.length} campo{group.fields.length !== 1 ? 's' : ''}</span>
              </button>
              {group.fields.map(({ field }) => (
                <TemplateFieldInput
                  key={field.id}
                  field={field}
                  value={testFieldData[field.id] || ''}
                  onChange={(v) => setTestFieldData(prev => ({ ...prev, [field.id]: v }))}
                  designMD={designMD}
                  mediaFit={testMediaFits[field.id]}
                  onMediaFitChange={(fit) => setTestMediaFits(prev => ({ ...prev, [field.id]: fit }))}
                  containBgColor={testContainBgColors[field.id] ?? null}
                  onContainBgColorChange={(color) => setTestContainBgColors(prev => ({ ...prev, [field.id]: color }))}
                />
              ))}
            </div>
          ))
        ) : (
          allEditableSlots.map(({ field }) => (
            <TemplateFieldInput
              key={field.id}
              field={field}
              value={testFieldData[field.id] || ''}
              onChange={(v) => setTestFieldData(prev => ({ ...prev, [field.id]: v }))}
              designMD={designMD}
              mediaFit={testMediaFits[field.id]}
              onMediaFitChange={(fit) => setTestMediaFits(prev => ({ ...prev, [field.id]: fit }))}
              containBgColor={testContainBgColors[field.id] ?? null}
              onContainBgColorChange={(color) => setTestContainBgColors(prev => ({ ...prev, [field.id]: color }))}
            />
          ))
        )}

        {/* Brand variables (read-only) */}
        {brandVars.length > 0 && (
          <div className="pt-4 border-t border-neutral-800/50">
            <p className="text-[9px] text-violet-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1">
              <Zap size={8} /> Auto-completados desde {company.name}
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
                      {resolveBrandTestValue(field, company, designMD) || '(no configurado)'}
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
  );
};
