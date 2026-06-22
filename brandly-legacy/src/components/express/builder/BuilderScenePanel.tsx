import React from 'react';
import { X, Type, Image as ImageIcon, Plus, Trash2, Zap, Clock, Layers, Sparkles, Globe, Instagram, AtSign } from 'lucide-react';
import { ExpressScene, ExpressField, SceneLayout, BrandContentPiece, DesignMD, TimelineElement } from '../../../types';
import { useEditor } from '../../../context/EditorContext';
import { CollapsibleSection } from '../../ui/CollapsibleSection';

interface BuilderScenePanelProps {
  onClose: () => void;
  scene: ExpressScene;
  onUpdateScene: (updated: ExpressScene) => void;
  brandContent: BrandContentPiece[];
  designMD: DesignMD;
  isVideo: boolean;
}

/** Layout options */
const LAYOUTS: { value: SceneLayout; label: string; icon: string }[] = [
  { value: 'fullscreen-media', label: 'Pantalla completa', icon: '📸' },
  { value: 'overlay', label: 'Overlay', icon: '🔲' },
  { value: 'split', label: 'Dividido', icon: '◫' },
  { value: 'media-left', label: 'Media izq.', icon: '◧' },
  { value: 'media-right', label: 'Media der.', icon: '◨' },
  { value: 'text-only', label: 'Solo texto', icon: '📝' },
];

/** Brand variables available for insertion */
const BRAND_VARIABLES: { source: ExpressField['brandSource']; label: string; icon: React.ReactNode; type: ExpressField['type'] }[] = [
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
 * BuilderScenePanel — Sliding panel for scene-specific configuration.
 * 
 * This is the template-builder counterpart of TextPanel/ShapesPanel.
 * It manages scene metadata (name, type, duration, background, layout)
 * and lets users add brand variables and brand assets as TimelineElements.
 */
export const BuilderScenePanel: React.FC<BuilderScenePanelProps> = ({
  onClose,
  scene,
  onUpdateScene,
  brandContent,
  designMD,
  isVideo,
}) => {
  const {
    setTimelineElements,
    setSelectedElementId,
    layers,
    activeLayerId,
    durationInFrames,
  } = useEditor();

  // ── Add a brand-variable element to the canvas via EditorContext ──
  const addBrandField = (
    type: ExpressField['type'],
    label: string,
    brandSource?: ExpressField['brandSource'],
  ) => {
    const newId = 'el-' + Date.now();
    const elType: TimelineElement['type'] = type === 'text' ? 'text' : 'image';

    // Determine target layer
    let targetLayerId = activeLayerId;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.type === 'brand' || activeLayer.type === 'audio') {
      const visual = layers.find(l => l.type === 'visual' || l.type == null);
      if (visual) targetLayerId = visual.id;
    }

    const newElement: TimelineElement = {
      id: newId,
      layerId: targetLayerId,
      type: elType,
      content: brandSource ? `{${brandSource}}` : label,
      startFrame: 0,
      endFrame: durationInFrames,
      x: 50,
      y: 50,
      width: type === 'text' ? 80 : 40,
      height: type === 'text' ? 10 : 20,
      fontSize: type === 'text' ? 24 : undefined,
      fontWeight: type === 'text' ? 400 : undefined,
      elementName: label,
      notes: JSON.stringify({
        __expressField: true,
        brandSource,
        required: false,
        fieldType: type,
      }),
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  };

  // ── Add a brand content asset ──
  const addBrandAsset = (asset: BrandContentPiece) => {
    const newId = 'el-asset-' + Date.now();
    const elType: TimelineElement['type'] = asset.type === 'custom-image' ? 'image' : 'text';

    let targetLayerId = activeLayerId;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.type === 'brand' || activeLayer.type === 'audio') {
      const visual = layers.find(l => l.type === 'visual' || l.type == null);
      if (visual) targetLayerId = visual.id;
    }

    const newElement: TimelineElement = {
      id: newId,
      layerId: targetLayerId,
      type: elType,
      content: asset.content.text || asset.name,
      startFrame: 0,
      endFrame: durationInFrames,
      x: 50,
      y: 50,
      width: 40,
      height: 20,
      fontSize: asset.style.fontSize || 20,
      fontWeight: 600,
      elementName: asset.name,
      notes: JSON.stringify({
        __expressField: true,
        brandAssetId: asset.id,
        required: false,
        fieldType: asset.type === 'custom-image' ? 'media' : 'text',
      }),
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  };

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers size={14} className="text-amber-400" />
          Escena
        </h3>
        <button onClick={onClose} title="Cerrar Panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {/* Scene name */}
        <div className="space-y-1">
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

        {/* Quick-add field buttons */}
        <div className="space-y-2">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">
            Agregar campos
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => addBrandField('text', 'Texto')}
              title="Agregar campo de texto"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-neutral-700 text-[9px] text-neutral-500 hover:border-violet-500/50 hover:text-violet-400 transition-all"
            >
              <Plus size={8} /> Texto
            </button>
            <button
              onClick={() => addBrandField('media', 'Media')}
              title="Agregar campo de media"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-neutral-700 text-[9px] text-neutral-500 hover:border-sky-500/50 hover:text-sky-400 transition-all"
            >
              <Plus size={8} /> Media
            </button>
          </div>
        </div>

        <hr className="border-neutral-800/50" />

        {/* Brand Variables */}
        <div className="space-y-2">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Zap size={8} className="text-violet-400" /> Variables de Marca
          </label>
          <div className="grid grid-cols-2 gap-1">
            {BRAND_VARIABLES.map(v => (
              <button
                key={v.source}
                onClick={() => addBrandField(v.type, v.label, v.source)}
                title={`Insertar {${v.source}}`}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-[9px] text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all"
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-neutral-800/50" />

        {/* ── Diseño y Fondo (collapsible) ── */}
        <CollapsibleSection title="Diseño y Fondo">
          {/* Layout */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Layers size={8} /> Layout
            </label>
            <div className="grid grid-cols-2 gap-1">
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
                  {bg === 'brand' ? '🎨' : bg === 'solid' ? '⬛' : bg === 'gradient' ? '🌈' : '📷'}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Content Assets */}
          {brandContent.length > 0 && (
            <div className="space-y-2">
              <label className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                <ImageIcon size={8} className="text-amber-400" /> Assets de Marca
              </label>
              <div className="grid grid-cols-2 gap-1">
                {brandContent.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => addBrandAsset(asset)}
                    title={`Insertar asset: ${asset.name}`}
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
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};
