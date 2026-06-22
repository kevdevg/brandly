import React, { useCallback } from 'react';
import { Layers, Music, Square, ChevronRight, ChevronDown, Eye, EyeOff, GripVertical, Lock, Volume2, VolumeX, Upload, Type, Image as ImageIcon, Video, Film, ToggleLeft, ToggleRight, Frame, Stamp } from 'lucide-react';
import { TimelineElement, TimelineLayer, DesignMD } from '../../types';
import { getLabelClass } from './timelineUtils';
import { FileDropZone } from '../ui/FileDropZone';
import { useEditor } from '../../context/EditorContext';
import { getAudioDuration, durationToFrames } from '../../utils/audioMetadata';
import { uploadMedia } from '../../utils/mediaUploader';

interface TimelineLayerLabelsProps {
  layers: TimelineLayer[];
  setLayers: React.Dispatch<React.SetStateAction<TimelineLayer[]>>;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  expandedLayers: Record<string, boolean>;
  toggleLayer: (layerId: string) => void;
  draggedLayerId: string | null;
  onDragLayerStart: (e: React.DragEvent, id: string) => void;
  onDropLayer: (e: React.DragEvent, targetId: string) => void;
  setDraggedLayerId: (id: string | null) => void;
  setDragMousePos: (pos: { x: number; y: number } | null) => void;
  setLayerContextMenu: (menu: { layerId: string; x: number; y: number } | null) => void;
  playerRef: React.RefObject<any>;
  outputFormat?: 'video' | 'image';
  durationInFrames: number;
  designMD?: DesignMD;
}

export const TimelineLayerLabels: React.FC<TimelineLayerLabelsProps> = ({
  layers,
  setLayers,
  timelineElements,
  setTimelineElements,
  activeLayerId,
  setActiveLayerId,
  selectedElementId,
  setSelectedElementId,
  expandedLayers,
  toggleLayer,
  draggedLayerId,
  onDragLayerStart,
  onDropLayer,
  setDraggedLayerId,
  setDragMousePos,
  setLayerContextMenu,
  playerRef,
  outputFormat,
  durationInFrames,
  designMD
}) => {
  const { brandVisibility, setBrandVisibility } = useEditor();

  const sortedLayers = [
    ...layers.filter(l => l.type === 'brand'),
    ...layers.filter(l => l.type === 'background'),
    ...layers.filter(l => outputFormat !== 'image' && l.type === 'video'),
    ...layers.filter(l => outputFormat !== 'image' && l.type === 'audio'),
    ...layers.filter(l => l.type === 'visual' || l.type == null)
  ];

  const hasLogo = !!designMD?.logoUrl;
  const hasFrame = (designMD?.frameThickness ?? 0) > 0;

  // === Intro/Outro toggle helpers ===
  const introEl = timelineElements.find(el => el.isBrandElement && el.content === designMD?.introVideoUrl);
  const outroEl = timelineElements.find(el => el.isBrandElement && el.content === designMD?.outroVideoUrl);
  const hasIntroVideo = !!designMD?.introVideoUrl;
  const hasOutroVideo = !!designMD?.outroVideoUrl;
  const isIntroActive = !!introEl;
  const isOutroActive = !!outroEl;

  const toggleIntro = useCallback(() => {
    if (!designMD?.introVideoUrl) return;
    const introDur = designMD.introDurationFrames || 60;

    if (isIntroActive && introEl) {
      // Deactivate: remove intro, shift content back
      const introLen = introEl.endFrame - introEl.startFrame;
      setTimelineElements(prev => prev
        .filter(el => el.id !== introEl.id)
        .map(el => el.isBrandElement ? el : {
          ...el,
          startFrame: Math.max(0, el.startFrame - introLen),
          endFrame: Math.max(1, el.endFrame - introLen),
        })
      );
    } else {
      // Activate: shift content forward, add intro
      setTimelineElements(prev => [
        ...prev.map(el => el.isBrandElement ? el : {
          ...el,
          startFrame: el.startFrame + introDur,
          endFrame: el.endFrame + introDur,
        }),
        {
          id: `el-intro-${Date.now()}`,
          layerId: 'brand-layer',
          type: 'video' as const,
          content: designMD.introVideoUrl!,
          isBrandElement: true,
          brandDisplayMode: 'fullscreen' as const,
          startFrame: 0,
          endFrame: introDur,
          x: designMD.introVideoX ?? 0,
          y: designMD.introVideoY ?? 0,
          w: designMD.introVideoW ?? 100,
          h: designMD.introVideoH ?? 100,
          blendMode: designMD.introBlendMode || 'normal',
        },
      ]);
    }
  }, [designMD, isIntroActive, introEl, setTimelineElements]);

  const toggleOutro = useCallback(() => {
    if (!designMD?.outroVideoUrl) return;
    const outroDur = designMD.outroDurationFrames || 60;

    if (isOutroActive && outroEl) {
      // Deactivate: just remove outro
      setTimelineElements(prev => prev.filter(el => el.id !== outroEl.id));
    } else {
      // Activate: add outro after all content
      const maxFrame = Math.max(...timelineElements.filter(el => !el.isBrandElement || el.content !== designMD.outroVideoUrl).map(el => el.endFrame), 0);
      setTimelineElements(prev => [
        ...prev,
        {
          id: `el-outro-${Date.now()}`,
          layerId: 'brand-layer',
          type: 'video' as const,
          content: designMD.outroVideoUrl!,
          isBrandElement: true,
          brandDisplayMode: 'fullscreen' as const,
          startFrame: maxFrame,
          endFrame: maxFrame + outroDur,
          x: designMD.outroVideoX ?? 0,
          y: designMD.outroVideoY ?? 0,
          w: designMD.outroVideoW ?? 100,
          h: designMD.outroVideoH ?? 100,
          blendMode: designMD.outroBlendMode || 'normal',
        },
      ]);
    }
  }, [designMD, isOutroActive, outroEl, timelineElements, setTimelineElements]);

  return (
    <div className={`${outputFormat === 'image' ? 'flex-1 w-full' : 'w-48'} border-r border-neutral-800 bg-neutral-950/80 z-20 flex flex-col overflow-y-auto hide-scrollbar shrink-0`}>
      <div className="h-6 border-b border-neutral-800/50 shrink-0 bg-neutral-900/50"></div> {/* Spacer for Ruler */}
      <div className="flex-1 py-2 space-y-2 mb-8">
        {sortedLayers.map((layer) => {
          const isExpanded = expandedLayers[layer.id];
          const layerElements = timelineElements.filter(e => e.layerId === layer.id);
          return (
            <div 
              key={`label-group-${layer.id}`} 
              className={`flex flex-col gap-2 transition-opacity ${draggedLayerId === layer.id ? 'opacity-40' : 'opacity-100'}`}
              draggable={layer.type !== 'brand'}
              onDragStart={(e) => layer.type !== 'brand' && onDragLayerStart(e, layer.id)}
              onDrag={(e) => {
                if (e.clientX !== 0 || e.clientY !== 0) setDragMousePos({ x: e.clientX, y: e.clientY });
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => onDropLayer(e, layer.id)}
              onDragEnd={() => { setDraggedLayerId(null); setDragMousePos(null); }}
            >
              <div 
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLayerContextMenu({ layerId: layer.id, x: e.clientX, y: e.clientY });
                }}
                onClick={() => { 
                  setActiveLayerId(layer.id); 
                  setSelectedElementId(null); 
                  if (layerElements.length > 0 || layer.type === 'audio' || layer.type === 'video' || layer.type === 'background' || layer.type === 'brand') toggleLayer(layer.id);
                }}
                className={`h-8 px-2 flex items-center gap-1.5 cursor-pointer transition-colors border-l-2 group
                  ${getLabelClass(layer.colorLabel, activeLayerId === layer.id)}
                `}
              >
                 {layer.type !== 'brand' && (
                   <div className="cursor-grab active:cursor-grabbing text-neutral-600 group-hover:text-neutral-400 p-0.5" title="Arrastrar para reordenar capas">
                     <GripVertical size={12} />
                   </div>
                 )}
                 {layer.type === 'brand' ? <Lock size={12} className="shrink-0 text-amber-500" /> : layer.type === 'video' ? <Film size={12} className="shrink-0 text-sky-400" /> : layer.type === 'audio' ? <Music size={12} className="shrink-0 text-violet-400" /> : layer.type === 'background' ? <Square size={12} className="shrink-0 text-blue-400" /> : <Layers size={12} className="shrink-0 text-emerald-400" />}
                 <input 
                   type="text"
                   className={`text-[10px] font-medium truncate flex-1 opacity-90 bg-transparent border-none outline-none focus:bg-neutral-800 focus:text-white px-1 rounded ${layer.isLocked ? "line-through text-neutral-500" : ""}`}
                   value={layer.name}
                   onChange={(e) => {
                     setLayers(layers.map(l => l.id === layer.id ? { ...l, name: e.target.value } : l));
                   }}
                   onClick={(e) => e.stopPropagation()}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') e.currentTarget.blur();
                   }}
                   readOnly={layer.isLocked || layer.type === 'brand'}
                 />
                 {layer.type === 'brand' && (
                   <span className="text-[8px] font-bold uppercase tracking-wider text-amber-500/80 bg-amber-950/30 px-1.5 py-0.5 rounded shrink-0">🔒</span>
                 )}
                 {layer.isLocked && <Lock size={12} className="text-neutral-500 mr-1 shrink-0" />}
                 <div 
                   className="flex items-center shrink-0 gap-1"
                   draggable
                   onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                   onPointerDown={(e) => e.stopPropagation()}
                   onClick={(e) => e.stopPropagation()}
                 >
                   {layer.type === 'audio' ? (
                     <>
                        {/* Mute button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(layers.map(l => l.id === layer.id ? { ...l, isMuted: !l.isMuted } : l));
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            layer.isMuted ? 'text-red-400 hover:text-red-300' : 'text-neutral-500 hover:text-white'
                          }`}
                          title={layer.isMuted ? 'Activar Sonido' : 'Silenciar (M)'}
                        >
                          {layer.isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        </button>
                        {/* Solo button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(layers.map(l => l.id === layer.id ? { ...l, isSolo: !l.isSolo } : { ...l, isSolo: false }));
                          }}
                          className={`text-[8px] font-bold px-1 py-0.5 rounded transition-colors ${
                            layer.isSolo ? 'bg-amber-500/30 text-amber-300' : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'
                          }`}
                          title={layer.isSolo ? 'Desactivar Solo' : 'Solo (S) — Solo esta pista suena'}
                        >
                          S
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={layer.volume ?? 100}
                          draggable
                          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setLayers(layers.map(l => l.id === layer.id ? { ...l, volume: Number(e.target.value) } : l));
                          }}
                          className="w-10 h-1 cursor-pointer accent-neutral-400 hover:accent-white transition-all"
                          title="Volumen"
                        />
                       <div className="inline-block" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                         <FileDropZone
                           compact
                           accept="audio/mp3,audio/mpeg"
                           label=""
                           icon={<Upload size={12} />}
                           onFiles={async (files) => {
                             const file = files[0];
                             if (!file || !playerRef.current) return;
                             try {
                               const result = await uploadMedia(file);
                               const currentFrame = playerRef.current.getCurrentFrame() || 0;
                               
                               // Get real audio duration
                               let endFrame = Math.min(durationInFrames, currentFrame + 300);
                               try {
                                 const dur = await getAudioDuration(result.url);
                                 endFrame = currentFrame + durationToFrames(dur);
                               } catch {}
                               
                               setTimelineElements(prev => [...prev, {
                                 id: Date.now().toString(),
                                 layerId: layer.id,
                                 type: 'audio',
                                 content: result.url,
                                 startFrame: currentFrame,
                                 endFrame,
                                 x: 0,
                                 y: 0,
                                 originalFileName: result.originalName,
                               }]);
                             } catch (err) {
                               console.error('Audio upload failed:', err);
                             }
                           }}
                         />
                       </div>
                     </>
                   ) : (
                     <>
                       <button 
                         onClick={(e) => { 
                           e.stopPropagation();
                           setLayers(layers.map(l => l.id === layer.id ? { ...l, isVisible: l.isVisible === false ? true : false } : l));
                         }}
                         className={`p-1 hover:bg-neutral-700/80 rounded transition-colors ${layer.isVisible === false ? 'text-neutral-600' : 'text-neutral-500 hover:text-white'}`}
                         title={layer.isVisible === false ? "Mostrar Capa" : "Ocultar Capa"}
                       >
                         {layer.isVisible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                       </button>
                     </>
                   )}
                   {(layerElements.length > 0 || layer.type === 'audio' || layer.type === 'video' || layer.type === 'background' || layer.type === 'brand') && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }}
                       title={isExpanded ? "Contraer Capa" : "Expandir Capa"}
                       className="p-1 hover:bg-neutral-700/80 rounded text-neutral-500 hover:text-white transition-colors"
                     >
                       {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                     </button>
                   )}
                 </div>
              </div>
              {isExpanded && (
                <div className="flex flex-col gap-2">
                  {/* Brand layer: show intro/outro/logo/frame toggles */}
                  {layer.type === 'brand' ? (
                    <>
                      {hasIntroVideo && (
                        <div 
                          className={`h-8 pl-5 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                            ${isIntroActive ? 'hover:bg-neutral-900/50 text-neutral-400' : 'hover:bg-neutral-900/50 text-neutral-600'}
                          `}
                          onClick={(e) => { e.stopPropagation(); toggleIntro(); }}
                        >
                          <button
                            className={`p-0.5 rounded transition-colors ${
                              isIntroActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                            title={isIntroActive ? 'Desactivar Intro' : 'Activar Intro'}
                          >
                            {isIntroActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <Video size={10} className={isIntroActive ? 'text-emerald-400' : 'text-neutral-600'} />
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${isIntroActive ? 'text-emerald-400' : 'text-neutral-600 line-through'}`}>Intro</span>
                          {isIntroActive && introEl && (
                            <span className="text-[8px] text-neutral-600 ml-auto font-mono">{((introEl.endFrame - introEl.startFrame) / 30).toFixed(1)}s</span>
                          )}
                        </div>
                      )}
                      {hasOutroVideo && (
                        <div 
                          className={`h-8 pl-5 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                            ${isOutroActive ? 'hover:bg-neutral-900/50 text-neutral-400' : 'hover:bg-neutral-900/50 text-neutral-600'}
                          `}
                          onClick={(e) => { e.stopPropagation(); toggleOutro(); }}
                        >
                          <button
                            className={`p-0.5 rounded transition-colors ${
                              isOutroActive ? 'text-rose-400 hover:text-rose-300' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                            title={isOutroActive ? 'Desactivar Outro' : 'Activar Outro'}
                          >
                            {isOutroActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <Video size={10} className={isOutroActive ? 'text-rose-400' : 'text-neutral-600'} />
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${isOutroActive ? 'text-rose-400' : 'text-neutral-600 line-through'}`}>Outro</span>
                          {isOutroActive && outroEl && (
                            <span className="text-[8px] text-neutral-600 ml-auto font-mono">{((outroEl.endFrame - outroEl.startFrame) / 30).toFixed(1)}s</span>
                          )}
                        </div>
                      )}
                      {/* Logo toggle */}
                      {hasLogo && (
                        <div 
                          className={`h-8 pl-5 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                            ${brandVisibility.logo ? 'hover:bg-neutral-900/50 text-neutral-400' : 'hover:bg-neutral-900/50 text-neutral-600'}
                          `}
                          onClick={(e) => { e.stopPropagation(); setBrandVisibility(prev => ({ ...prev, logo: !prev.logo })); }}
                        >
                          <button
                            className={`p-0.5 rounded transition-colors ${
                              brandVisibility.logo ? 'text-sky-400 hover:text-sky-300' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                            title={brandVisibility.logo ? 'Ocultar Logo' : 'Mostrar Logo'}
                          >
                            {brandVisibility.logo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <Stamp size={10} className={brandVisibility.logo ? 'text-sky-400' : 'text-neutral-600'} />
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${brandVisibility.logo ? 'text-sky-400' : 'text-neutral-600 line-through'}`}>Logo</span>
                        </div>
                      )}
                      {/* Frame toggle */}
                      {hasFrame && (
                        <div 
                          className={`h-8 pl-5 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                            ${brandVisibility.frame ? 'hover:bg-neutral-900/50 text-neutral-400' : 'hover:bg-neutral-900/50 text-neutral-600'}
                          `}
                          onClick={(e) => { e.stopPropagation(); setBrandVisibility(prev => ({ ...prev, frame: !prev.frame })); }}
                        >
                          <button
                            className={`p-0.5 rounded transition-colors ${
                              brandVisibility.frame ? 'text-amber-400 hover:text-amber-300' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                            title={brandVisibility.frame ? 'Ocultar Marco' : 'Mostrar Marco'}
                          >
                            {brandVisibility.frame ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <Frame size={10} className={brandVisibility.frame ? 'text-amber-400' : 'text-neutral-600'} />
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${brandVisibility.frame ? 'text-amber-400' : 'text-neutral-600 line-through'}`}>Marco</span>
                        </div>
                      )}
                      {/* Background toggle */}
                      <div 
                        className={`h-8 pl-5 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                          ${brandVisibility.background ? 'hover:bg-neutral-900/50 text-neutral-400' : 'hover:bg-neutral-900/50 text-neutral-600'}
                        `}
                        onClick={(e) => { e.stopPropagation(); setBrandVisibility(prev => ({ ...prev, background: !prev.background })); }}
                      >
                        <button
                          className={`p-0.5 rounded transition-colors ${
                            brandVisibility.background ? 'text-violet-400 hover:text-violet-300' : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                          title={brandVisibility.background ? 'Ocultar Fondo' : 'Mostrar Fondo'}
                        >
                          {brandVisibility.background ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <Square size={10} className={brandVisibility.background ? 'text-violet-400' : 'text-neutral-600'} />
                        <span className={`text-[9px] font-semibold uppercase tracking-wider ${brandVisibility.background ? 'text-violet-400' : 'text-neutral-600 line-through'}`}>Fondo</span>
                      </div>
                    </>
                  ) : (
                    layerElements.map((el, index) => (
                      <div 
                        key={`label-el-${el.id}`}
                        onClick={() => { 
                          setSelectedElementId(el.id); 
                          setActiveLayerId(layer.id); 
                          playerRef.current?.seekTo(el.startFrame); 
                        }}
                        className={`h-8 pl-6 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-l-2 border-transparent
                          ${selectedElementId === el.id ? 'bg-neutral-800/80 text-white' : 'hover:bg-neutral-900/50 text-neutral-500'}
                        `}
                      >
                        <span className="text-[9px] font-mono text-neutral-500 shrink-0 w-3 text-right">{index + 1}</span>
                        {el.type === 'text' ? <Type size={10} /> : el.type === 'audio' ? <Music size={10} /> : <ImageIcon size={10} />}
                        <span className="text-[9px] truncate">{el.type === 'text' ? el.content : el.type === 'audio' ? 'Audio' : el.type === 'image' ? 'Imagen' : el.type === 'video' ? 'Video' : 'Sticker'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div className="mx-2 mt-4 flex flex-col gap-1.5 pb-4">
          <span className="text-[10px] text-neutral-500 font-medium px-1 mb-1">Nueva Capa de:</span>
          <div className="flex gap-1.5">
            <button 
              onClick={() => {
                const count = layers.filter(l => l.type === 'visual' || l.type == null).length + 1;
                const newId = 'layer-' + Date.now();
                setLayers([...layers, { id: newId, name: `Capa Gráfica ${count}`, type: 'visual' }]);
                setActiveLayerId(newId);
              }}
              className="flex-1 flex items-center justify-center py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 rounded transition-all"
              title="Capa Gráfica (Visuales, Stickers, Textos)"
            >
              <Layers size={12} />
            </button>
            {outputFormat !== 'image' && (
            <>
            <button 
              onClick={() => {
                const count = layers.filter(l => l.type === 'video').length + 1;
                setLayers([...layers, { id: 'layer-' + Date.now(), name: `Capa de Video ${count}`, type: 'video' }]);
              }}
              className="flex-1 flex items-center justify-center py-1.5 bg-sky-950/20 border border-sky-900/30 text-sky-400 hover:text-sky-300 hover:bg-sky-900/40 hover:border-sky-500/50 rounded transition-all"
              title="Capa de Video (Clips de video)"
            >
              <Film size={12} />
            </button>
            <button 
              onClick={() => {
                const count = layers.filter(l => l.type === 'audio').length + 1;
                setLayers([...layers, { id: 'layer-' + Date.now(), name: `Capa de Audio ${count}`, type: 'audio', volume: 100 }]);
              }}
              className="flex-1 flex items-center justify-center py-1.5 bg-violet-950/20 border border-violet-900/30 text-violet-400 hover:text-violet-300 hover:bg-violet-900/40 hover:border-violet-500/50 rounded transition-all"
              title="Capa de Audio (Audio MP3, Subtítulos)"
            >
              <Music size={12} />
            </button>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
