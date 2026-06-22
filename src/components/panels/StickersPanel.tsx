import React, { useCallback } from 'react';
import { X, Stamp, Image as ImageIcon, Type, AtSign, Globe, Instagram } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { FileDropZone } from '../ui/FileDropZone';
import { TimelineElement } from '../../types';

interface StickersPanelProps {
  onClose: () => void;
}

/**
 * Panel for brand assets: branded text presets, social handles, stickers.
 * Text presets use the brand font, color, and name from designMD.
 */
export const StickersPanel: React.FC<StickersPanelProps> = ({ onClose }) => {
  const {
    designMD, brandContent,
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    setTimelineElements,
    setSelectedElementId,
    playerRef,
    durationInFrames,
  } = useEditor();

  const brandName = designMD.brandName || 'Mi Marca';
  const font = designMD.baseFont || 'system-ui';
  const color = designMD.textColor || '#ffffff';
  const social = designMD.socialHandles || {};

  const brandContentThumbnails = (brandContent || [])
    .filter(p => p.thumbnail)
    .map(p => ({ src: p.thumbnail!, name: p.name, id: p.id }));

  const legacyStickers = designMD.brandStickers || [];

  // Add branded text element to a visual layer
  const addBrandText = useCallback((content: string, fontSize?: number, y?: number) => {
    const currentFrame = playerRef.current?.getCurrentFrame() || 0;
    const newId = 'el-' + Date.now();

    let targetLayerId = activeLayerId;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.type === 'brand' || activeLayer.type === 'video' || activeLayer.type === 'audio') {
      let visualLayer = layers.find(l => l.type === 'visual' || l.type == null);
      if (!visualLayer) {
        visualLayer = { id: 'layer-' + Date.now(), name: 'Capa Gráfica 1', type: 'visual' };
        setLayers(prev => [...prev, visualLayer!]);
      }
      targetLayerId = visualLayer.id;
      setActiveLayerId(targetLayerId);
    }

    const newElement: TimelineElement = {
      id: newId,
      layerId: targetLayerId,
      type: 'text',
      content,
      startFrame: currentFrame,
      endFrame: Math.min(durationInFrames, currentFrame + 100),
      x: 50,
      y: y ?? 50,
      fontSize,
      fontFamily: font,
      color: color,
      useBranding: true,
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, [layers, activeLayerId, playerRef, durationInFrames, setTimelineElements, setSelectedElementId, setLayers, setActiveLayerId, font, color]);

  // Build social text presets
  const socialPresets: { label: string; content: string; icon: React.ReactNode }[] = [];
  if (social.instagram) socialPresets.push({ label: 'Instagram', content: social.instagram, icon: <Instagram size={12} /> });
  if (social.tiktok) socialPresets.push({ label: 'TikTok', content: social.tiktok, icon: <AtSign size={12} /> });
  if (social.twitter) socialPresets.push({ label: 'Twitter/X', content: social.twitter, icon: <AtSign size={12} /> });
  if (social.youtube) socialPresets.push({ label: 'YouTube', content: social.youtube, icon: <AtSign size={12} /> });
  if (social.website) socialPresets.push({ label: 'Web', content: social.website, icon: <Globe size={12} /> });

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Stamp size={14} className="text-amber-400" />
          Marca
        </h3>
        <button onClick={onClose} title="Cerrar Panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-4">

        {/* ═══ Textos de Marca ═══ */}
        <div>
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Textos de Marca</span>
          <div className="space-y-1.5">
            {/* Brand name — large */}
            <button
              onClick={() => addBrandText(brandName, 64, 40)}
              title={`Añadir "${brandName}" como título`}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-neutral-950/60 border border-amber-900/30 rounded-lg text-left hover:border-amber-500/40 hover:bg-amber-950/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-md bg-amber-600/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Type size={14} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate" style={{ fontFamily: font }}>{brandName}</span>
                <span className="text-[9px] text-neutral-600">Título grande · 64px</span>
              </div>
            </button>

            {/* Brand name — subtitle */}
            <button
              onClick={() => addBrandText(brandName, 36, 50)}
              title={`Añadir "${brandName}" como subtítulo`}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-left hover:border-amber-500/30 hover:bg-amber-950/10 transition-all group"
            >
              <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center shrink-0">
                <Type size={12} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-neutral-300 block truncate" style={{ fontFamily: font }}>{brandName}</span>
                <span className="text-[9px] text-neutral-600">Subtítulo · 36px</span>
              </div>
            </button>

            {/* Brand name — small watermark */}
            <button
              onClick={() => addBrandText(brandName, 20, 90)}
              title={`Añadir "${brandName}" como marca de agua`}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-left hover:border-amber-500/30 hover:bg-amber-950/10 transition-all group"
            >
              <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center shrink-0">
                <Type size={10} className="text-neutral-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-neutral-400 block truncate" style={{ fontFamily: font }}>{brandName}</span>
                <span className="text-[9px] text-neutral-600">Marca de agua · 20px</span>
              </div>
            </button>
          </div>
        </div>

        {/* ═══ Redes Sociales ═══ */}
        {socialPresets.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Redes Sociales</span>
            <div className="space-y-1.5">
              {socialPresets.map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => addBrandText(sp.content, 28, 85)}
                  title={`Añadir ${sp.label}: ${sp.content}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-left hover:border-violet-500/30 hover:bg-violet-950/10 transition-all group"
                >
                  <div className="w-7 h-7 rounded-md bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-400">
                    {sp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-neutral-300 block truncate">{sp.content}</span>
                    <span className="text-[9px] text-neutral-600">{sp.label} · 28px</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Contenido Visual de Marca ═══ */}
        {brandContentThumbnails.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Contenido Visual</span>
            <div className="grid grid-cols-2 gap-2">
              {brandContentThumbnails.map(item => (
                <div
                  key={item.id}
                  className="aspect-square bg-neutral-800 rounded-lg overflow-hidden group relative cursor-grab active:cursor-grabbing flex items-center justify-center p-2"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.src);
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'sticker', src: item.src, brandContentId: item.id }));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <img src={item.src} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" alt={item.name} draggable={false} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">Arrastrar</span>
                    <span className="text-[8px] text-neutral-300 mt-0.5">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Stickers */}
        {legacyStickers.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Stickers</span>
            <div className="grid grid-cols-2 gap-2">
              {legacyStickers.map((src, i) => (
                <div
                  key={`sticker-${i}`}
                  className="aspect-square bg-neutral-800 rounded-lg overflow-hidden group relative cursor-grab active:cursor-grabbing flex items-center justify-center p-2"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', src);
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'sticker', src }));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <img src={src} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" alt="Sticker" draggable={false} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">Arrastrar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload */}
        <FileDropZone
          accept="image/*"
          multiple
          onFiles={() => {}}
          label="Subir assets de marca"
          sublabel="PNG con transparencia"
        />
      </div>
    </div>
  );
};
