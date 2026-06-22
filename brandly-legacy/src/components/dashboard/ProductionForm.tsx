import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Sparkles, Zap, Play, ChevronRight, ChevronLeft, FileText, Download, Film,
  Layers, Package,
} from 'lucide-react';
import { PlayerRef } from '@remotion/player';
import {
  ExpressTemplate, CompanyProfile, DesignMD,
  TemplateField, BrandSource,
} from '../../types';
import { ExportModal } from '../export/ExportModal';
import { compileExpressToTimeline, getTemplateDuration } from '../../utils/expressCompiler';
import { TemplateFieldInput } from '../shared/TemplateFieldInput';
import { LivePreviewCanvas } from '../shared/LivePreviewCanvas';
import { migrateExpressFields } from '../../context/TemplateBuilderContext';
import { useBatchProduction } from '../../hooks/useBatchProduction';
import { BatchDataPanel } from './BatchDataPanel';
import { exportBatchAsZip, BatchExportProgress } from '../../utils/batchExporter';

interface ProductionFormProps {
  template: ExpressTemplate;
  brand: CompanyProfile;
  onBack: () => void;
  onProducePro: (fieldData: Record<string, string>) => void;
}

/** Resolve a brand variable to its value from DesignMD / CompanyProfile */
function resolveBrandValue(source: BrandSource | undefined, brand: CompanyProfile): string {
  if (!source) return '';
  switch (source) {
    case 'brand-name': return brand.name || brand.design.brandName || '';
    case 'tagline': return brand.tagline || '';
    case 'logo': return brand.design.logoUrl || '';
    case 'intro-video': return brand.design.introVideoUrl || '';
    case 'outro-video': return brand.design.outroVideoUrl || '';
    case 'primary-color': return brand.design.primaryColor;
    case 'secondary-color': return brand.design.secondaryColor;
    case 'instagram': return brand.socialLinks?.instagram || '';
    case 'tiktok': return brand.socialLinks?.tiktok || '';
    case 'twitter': return brand.socialLinks?.x || '';
    case 'youtube': return brand.socialLinks?.youtube || '';
    case 'website': return brand.socialLinks?.website || '';
    default: return '';
  }
}

/** Get all TemplateFields from a scene, migrating legacy fields if needed */
function getSceneTemplateFields(scene: ExpressTemplate['scenes'][0]): TemplateField[] {
  if (scene.fields && scene.fields.length > 0) return scene.fields;
  return migrateExpressFields(scene.editableFields);
}

/** Find the background field ID (first image/video editable-slot, prefer isBackground) */
function findBackgroundFieldId(template: ExpressTemplate): string | null {
  for (const scene of template.scenes) {
    const fields = scene.fields ?? [];
    const bgField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video') && f.isBackground
    );
    if (bgField) return bgField.id;
    const mediaField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video')
    );
    if (mediaField) return mediaField.id;
  }
  return null;
}

/**
 * ProductionForm — Two-panel production screen.
 * 
 * Supports two modes:
 * - Single piece (default): editable fields form + live preview
 * - Batch mode: multi-file upload + text table + thumbnail grid preview
 * 
 * Uses shared TemplateFieldInput and LivePreviewCanvas components.
 */
export const ProductionForm: React.FC<ProductionFormProps> = ({
  template,
  brand,
  onBack,
  onProducePro,
}) => {
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    template.scenes[0]?.id || null
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [mediaFits, setMediaFits] = useState<Record<string, 'cover' | 'contain' | 'fill'>>({});
  const [containBgColors, setContainBgColors] = useState<Record<string, string | null>>({});

  // Batch mode state
  const [batchExportProgress, setBatchExportProgress] = useState<BatchExportProgress | null>(null);
  const [activeBatchPieceIndex, setActiveBatchPieceIndex] = useState(0);
  const backgroundFieldId = useMemo(() => findBackgroundFieldId(template), [template]);

  const playerRef = useRef<PlayerRef>(null);

  const designMD = brand.design;
  const fps = 30;
  const totalDuration = getTemplateDuration(template);
  const totalFrames = Math.max(30, totalDuration * fps);

  // ─── Compile for ExportModal (only when modal is open — LivePreviewCanvas handles its own compile) ───
  const compiled = useMemo(
    () => {
      if (!showExportModal) return { elements: [], layers: [] };
      const result = compileExpressToTimeline(template, fieldData, designMD, brand);
      result.elements = result.elements.map(el => {
        const fieldId = el.sourceFieldId;
        const fitOverride = fieldId ? mediaFits[fieldId] : undefined;
        const bgOverride = fieldId ? containBgColors[fieldId] : undefined;
        return {
          ...el,
          transitionIn: undefined,
          transitionOut: undefined,
          ...(fitOverride ? { objectFit: fitOverride } : {}),
          ...(bgOverride !== undefined ? { containBgColor: bgOverride } : {}),
        };
      });
      return result;
    },
    [showExportModal, template, fieldData, designMD, brand, mediaFits, containBgColors]
  );

  // ─── Collect all TemplateFields across all scenes ───
  const allFields = useMemo(() => {
    const fields: { field: TemplateField; sceneId: string; sceneName: string }[] = [];
    for (const scene of template.scenes) {
      const sceneFields = getSceneTemplateFields(scene);
      for (const f of sceneFields) {
        fields.push({ field: f, sceneId: scene.id, sceneName: scene.name });
      }
    }
    return fields;
  }, [template]);

  // Separate into editable slots and brand variables
  const editableSlots = useMemo(() =>
    allFields
      .filter(f => f.field.nature === 'editable-slot')
      .sort((a, b) => a.field.formOrder - b.field.formOrder),
  [allFields]);

  const brandVars = useMemo(() =>
    allFields.filter(f => f.field.nature === 'brand-variable'),
  [allFields]);

  // Group editable slots by scene
  const sceneGroups = useMemo(() => {
    const groups: { sceneId: string; sceneName: string; fields: typeof editableSlots }[] = [];
    const seen = new Set<string>();
    for (const slot of editableSlots) {
      if (!seen.has(slot.sceneId)) {
        seen.add(slot.sceneId);
        groups.push({
          sceneId: slot.sceneId,
          sceneName: slot.sceneName,
          fields: editableSlots.filter(s => s.sceneId === slot.sceneId),
        });
      }
    }
    return groups;
  }, [editableSlots]);

  const isMultiScene = sceneGroups.length > 1;

  // ─── Batch mode hook ───
  const batch = useBatchProduction(editableSlots, template.format);

  // Active preview fieldData: in batch mode, use the active piece's data with background injected
  const activePreviewFieldData = useMemo(() => {
    if (!batch.isBatchMode) return fieldData;
    const piece = batch.pieces[activeBatchPieceIndex];
    if (!piece) return {};
    const fd: Record<string, string> = { ...piece.fieldData };
    if (backgroundFieldId && piece.backgroundUrl) {
      fd[backgroundFieldId] = piece.backgroundUrl;
    }
    return fd;
  }, [batch.isBatchMode, batch.pieces, activeBatchPieceIndex, backgroundFieldId, fieldData]);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setFieldData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[fieldId]; return next; });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const { field } of editableSlots) {
      const value = fieldData[field.id]?.trim();
      if (field.required && !value) {
        newErrors[field.id] = 'Campo obligatorio';
      }
      if (field.type === 'text' && field.rules?.maxChars && value && value.length > field.rules.maxChars) {
        newErrors[field.id] = `Máximo ${field.rules.maxChars} caracteres`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editableSlots, fieldData]);

  // ─── Detect form-sourced segments (intro/outro that need video upload) ───
  const formSegments = useMemo(() =>
    template.scenes.filter(
      s => (s.type === 'intro' || s.type === 'outro') && s.segmentSource === 'form'
    ),
  [template]);

  // ─── Detect brand-sourced segments (auto intro/outro from brand) ───
  const brandSegments = useMemo(() =>
    template.scenes.filter(
      s => (s.type === 'intro' || s.type === 'outro') && s.segmentSource === 'brand'
    ),
  [template]);


  // ─── Required fields completion check (includes segments) ───
  const requiredComplete = useMemo(() => {
    const slotsComplete = editableSlots
      .filter(s => s.field.required)
      .every(s => !!fieldData[s.field.id]?.trim());
    const segmentsComplete = formSegments
      .filter(s => s.segmentFieldRequired !== false)
      .every(s => !!fieldData[`segment-${s.id}`]?.trim());
    return slotsComplete && segmentsComplete;
  }, [editableSlots, fieldData, formSegments]);

  const handleProducePro = () => { if (validate()) onProducePro(fieldData); };
  const handleProduce = () => { if (validate()) setShowExportModal(true); };

  // ─── Batch export handler ───
  const handleBatchExport = useCallback(async () => {
    if (!batch.validateAll()) return;

    setBatchExportProgress({ current: 0, total: batch.pieceCount, status: 'rendering' });

    try {
      await exportBatchAsZip(
        batch.pieces,
        template,
        brand,
        { format: 'png' },
        (progress) => setBatchExportProgress(progress),
      );
    } catch (err) {
      console.error('Batch export failed:', err);
      setBatchExportProgress({ current: 0, total: 0, status: 'error', error: String(err) });
    }
  }, [batch, template, brand]);

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950 relative">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* ═══ LEFT PANEL ═══ */}
      <div className="w-[440px] shrink-0 flex flex-col border-r border-neutral-800/60 relative z-10 bg-neutral-950/95 backdrop-blur-sm">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-neutral-800/50 shrink-0">
          <button
            onClick={onBack}
            title="Volver al dashboard"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-xs mb-3"
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-900/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">Producir Contenido</h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-violet-400 font-semibold truncate">{template.icon} {template.name}</span>
                <span className="text-neutral-600 text-[10px]">×</span>
                <span className="text-[10px] text-amber-400 font-semibold truncate">{brand.name}</span>
              </div>
            </div>

            {/* ── Batch Toggle ── */}
            <button
              type="button"
              onClick={batch.toggleBatchMode}
              title={batch.isBatchMode ? 'Cambiar a pieza única' : 'Cambiar a modo lote'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all shrink-0 ${
                batch.isBatchMode
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-900/20'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
              }`}
            >
              <div className={`w-7 h-4 rounded-full relative transition-colors ${
                batch.isBatchMode ? 'bg-violet-600' : 'bg-neutral-700'
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${
                  batch.isBatchMode ? 'left-3.5' : 'left-0.5'
                }`} />
              </div>
              <Layers size={11} />
              En lote
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
              template.format === 'video' ? 'bg-violet-500/15 text-violet-300' : 'bg-sky-500/15 text-sky-300'
            }`}>
              {template.format === 'video' ? '🎬 Video' : '🖼️ Imagen'} · {template.aspectRatio}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              {template.scenes.length} escena{template.scenes.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ═══ CONDITIONAL CONTENT: Single vs Batch ═══ */}
        {batch.isBatchMode ? (
          /* ── BATCH MODE: BatchDataPanel ── */
          <BatchDataPanel
            pieces={batch.pieces}
            editableSlots={editableSlots}
            brand={brand}
            templateFormat={template.format}
            onSetBackgrounds={batch.setBackgroundFiles}
            onUpdateField={batch.updatePieceField}
            onImportCSV={batch.importCSV}
            onRemovePiece={batch.removePiece}
            backgroundFiles={batch.backgroundFiles}
          />
        ) : (
          /* ── SINGLE MODE: Original form ── */
          <>
            {/* Form header */}
            <div className="px-5 py-3 border-b border-neutral-800/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-violet-400" />
                <h2 className="text-xs font-bold text-white">Campos editables</h2>
                <span className="text-[9px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full font-medium">
                  {editableSlots.length} campo{editableSlots.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                El estilo de <span className="text-amber-400">{brand.name}</span> se aplica automáticamente.
              </p>
            </div>

            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
              {/* ── Segment upload fields (form-sourced intro/outro) ── */}
              {formSegments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Film size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Segmentos de video</span>
                  </div>
                  {formSegments.map(scene => {
                    const segFieldId = `segment-${scene.id}`;
                    const isIntro = scene.type === 'intro';
                    const syntheticField: TemplateField = {
                      id: segFieldId,
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
                        key={segFieldId}
                        field={syntheticField}
                        value={fieldData[segFieldId] || ''}
                        onChange={(v) => handleChange(segFieldId, v)}
                        error={errors[segFieldId]}
                        designMD={designMD}
                        mediaFit={mediaFits[segFieldId]}
                        onMediaFitChange={(fit) => setMediaFits(prev => ({ ...prev, [segFieldId]: fit }))}
                        containBgColor={containBgColors[segFieldId] ?? null}
                        onContainBgColorChange={(color) => setContainBgColors(prev => ({ ...prev, [segFieldId]: color }))}
                      />
                    );
                  })}
                </div>
              )}
              {editableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={24} className="text-neutral-700 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Esta plantilla no tiene campos editables.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">Todo se genera automáticamente desde la marca.</p>
                </div>
              ) : isMultiScene ? (
                /* ── Grouped by scene ── */
                sceneGroups.map(group => (
                  <div key={group.sceneId} className="space-y-3">
                    <button
                      onClick={() => setActiveSceneId(group.sceneId)}
                      title={`Ir a escena: ${group.sceneName}`}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                        activeSceneId === group.sceneId
                          ? 'border-violet-500/30 bg-violet-500/5'
                          : 'border-neutral-800/50 bg-neutral-900/30 hover:border-neutral-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        activeSceneId === group.sceneId ? 'bg-violet-500' : 'bg-neutral-600'
                      }`} />
                      <span className="text-[11px] font-semibold text-white flex-1">{group.sceneName}</span>
                      <span className="text-[9px] text-neutral-500">{group.fields.length} campo{group.fields.length !== 1 ? 's' : ''}</span>
                    </button>
                    {group.fields.map(({ field }) => (
                      <TemplateFieldInput
                        key={field.id}
                        field={field}
                        value={fieldData[field.id] || ''}
                        onChange={(v) => handleChange(field.id, v)}
                        error={errors[field.id]}
                        designMD={designMD}
                        mediaFit={mediaFits[field.id]}
                        onMediaFitChange={(fit) => setMediaFits(prev => ({ ...prev, [field.id]: fit }))}
                        containBgColor={containBgColors[field.id] ?? null}
                        onContainBgColorChange={(color) => setContainBgColors(prev => ({ ...prev, [field.id]: color }))}
                      />
                    ))}
                  </div>
                ))
              ) : (
                /* ── Single scene — flat list ── */
                editableSlots.map(({ field }) => (
                  <TemplateFieldInput
                    key={field.id}
                    field={field}
                    value={fieldData[field.id] || ''}
                    onChange={(v) => handleChange(field.id, v)}
                    error={errors[field.id]}
                    designMD={designMD}
                    mediaFit={mediaFits[field.id]}
                    onMediaFitChange={(fit) => setMediaFits(prev => ({ ...prev, [field.id]: fit }))}
                    containBgColor={containBgColors[field.id] ?? null}
                    onContainBgColorChange={(color) => setContainBgColors(prev => ({ ...prev, [field.id]: color }))}
                  />
                ))
              )}

              {/* Brand-sourced segments (auto intro/outro) */}
              {brandSegments.length > 0 && (
                <div className="pt-4 border-t border-neutral-800/50">
                  <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1">
                    <Sparkles size={8} /> Segmentos automáticos
                  </p>
                  <div className="space-y-2">
                    {brandSegments.map(scene => (
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
                    <Zap size={8} /> Auto-completados desde {brand.name}
                  </p>
                  <div className="space-y-2">
                    {brandVars.map(({ field }) => {
                      const resolvedValue = resolveBrandValue(field.brandSource, brand);
                      return (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 px-3 py-2.5 bg-violet-500/5 border border-violet-500/15 rounded-lg"
                        >
                          <Zap size={10} className="text-violet-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-violet-300 font-medium">{field.label}</span>
                            <span className="text-[9px] text-violet-400/50 block truncate">
                              {field.brandSource === 'logo' ? '(Logo de marca)' : resolvedValue || '(no configurado)'}
                            </span>
                          </div>
                          <span className="text-[7px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                            auto
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Sticky footer with actions ── */}
        <div className="px-5 py-3 border-t border-neutral-800/60 bg-neutral-950/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              title="Cancelar y volver al dashboard"
              className="px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 text-[10px] font-medium transition-all"
            >
              Cancelar
            </button>

            <div className="flex-1" />

            {batch.isBatchMode ? (
              /* ── Batch footer ── */
              <>
                {/* Export progress indicator */}
                {batchExportProgress && batchExportProgress.status === 'rendering' && (
                  <div className="flex items-center gap-2 mr-2">
                    <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all"
                        style={{ width: `${(batchExportProgress.current / batchExportProgress.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-neutral-400 font-mono">
                      {batchExportProgress.current}/{batchExportProgress.total}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleBatchExport}
                  disabled={batch.pieceCount === 0 || (batchExportProgress?.status === 'rendering')}
                  title={batch.pieceCount === 0 ? 'Sube fondos para comenzar' : `Generar y descargar ${batch.pieceCount} piezas como ZIP`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    batch.pieceCount > 0 && batchExportProgress?.status !== 'rendering'
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-violet-900/30 hover:shadow-violet-900/50'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Package size={12} />
                  Descargar ZIP ({batch.pieceCount})
                  <ChevronRight size={10} />
                </button>
              </>
            ) : (
              /* ── Single piece footer ── */
              <>
                <button
                  onClick={handleProducePro}
                  title="Abrir en Editor Pro con timeline completo"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-[10px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play size={11} />
                  Editor Pro
                  <ChevronRight size={10} />
                </button>

                <button
                  onClick={handleProduce}
                  disabled={!requiredComplete}
                  title={requiredComplete ? 'Producir contenido' : 'Completa los campos obligatorios'}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    requiredComplete
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-violet-900/30 hover:shadow-violet-900/50'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Download size={12} />
                  Producir
                  <ChevronRight size={10} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Same LivePreviewCanvas for both modes ═══ */}
      <div className="flex-1 flex flex-col relative z-10">
        <LivePreviewCanvas
          template={template}
          fieldData={activePreviewFieldData}
          brand={brand}
          designMD={designMD}
          mediaFits={mediaFits}
          containBgColors={containBgColors}
          activeSceneId={activeSceneId}
          onSceneChange={setActiveSceneId}
          playerRef={playerRef}
          statusLabel={
            batch.isBatchMode
              ? (batch.pieceCount > 0 ? `Pieza ${activeBatchPieceIndex + 1} de ${batch.pieceCount}` : 'Sin piezas')
              : (requiredComplete ? 'Listo' : 'Faltan campos')
          }
          isComplete={
            batch.isBatchMode
              ? (batch.pieceCount > 0 && (batch.pieces[activeBatchPieceIndex]?.isValid ?? false))
              : requiredComplete
          }
        />

        {/* ── Piece Navigator (batch mode only) ── */}
        {batch.isBatchMode && batch.pieceCount > 0 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-full px-4 py-2 shadow-xl">
            <button
              type="button"
              onClick={() => setActiveBatchPieceIndex(Math.max(0, activeBatchPieceIndex - 1))}
              disabled={activeBatchPieceIndex <= 0}
              title="Pieza anterior"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] text-neutral-300 font-semibold min-w-[80px] text-center">
              Pieza {activeBatchPieceIndex + 1} / {batch.pieceCount}
            </span>
            <button
              type="button"
              onClick={() => setActiveBatchPieceIndex(Math.min(batch.pieceCount - 1, activeBatchPieceIndex + 1))}
              disabled={activeBatchPieceIndex >= batch.pieceCount - 1}
              title="Pieza siguiente"
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ═══ Export Modal (single piece only) ═══ */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        designMD={designMD}
        textOverlay=""
        timelineElements={compiled.elements}
        layers={compiled.layers}
        durationInFrames={totalFrames}
        brandVisibility={{ logo: false, frame: false, background: true }}
        outputFormat={template.format}
        aspectRatio={template.aspectRatio}
      />
    </div>
  );
};
