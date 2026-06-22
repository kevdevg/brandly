import React, { RefObject, useState, useCallback, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { BrandComposition } from './BrandComposition';
import { RenderProps, TimelineElement } from '../types';
import { PlaySquare } from 'lucide-react';
import { CanvasWorkspace } from './ui/CanvasWorkspace';
import { useEditor } from '../context/EditorContext';
import { ElementActionToolbar } from './composition/ElementActionToolbar';
import { SAFE_AREAS } from '../config/constants';
import { getAudioDuration, durationToFrames } from '../utils/audioMetadata';

interface StudioWorkspaceProps {
  activeTool: 'select' | 'text' | 'sticker' | 'media' | 'transitions';
  setSelectedElementId: (id: string | null) => void;
  selectedElementId?: string | null;
  playerRef: RefObject<PlayerRef | null>;
  compositionProps: RenderProps;
  durationInFrames: number;
  timelineElements?: TimelineElement[];
  setTimelineElements?: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3') => void;
  outputFormat?: 'video' | 'image';
  activeLayerId?: string;
  /** Lifted zoom state for TopHeader integration */
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  activeTool,
  setSelectedElementId,
  selectedElementId,
  playerRef,
  compositionProps,
  durationInFrames,
  timelineElements,
  setTimelineElements,
  aspectRatio,
  setAspectRatio,
  outputFormat,
  activeLayerId,
  zoom,
  setZoom,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = React.useRef({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [safeAreaPlatform, setSafeAreaPlatform] = useState<keyof typeof SAFE_AREAS | null>(null);

  const { activeAction, setActiveAction } = useEditor();

  // Keyboard shortcuts for action modes (M/S/R) and element actions (D/Delete)
  useEffect(() => {
    if (!selectedElementId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const selectedEl = timelineElements?.find(el => el.id === selectedElementId);
      if (!selectedEl) return;
      switch (e.key.toLowerCase()) {
        case 'm': setActiveAction('move'); break;
        case 's': setActiveAction('scale'); break;
        case 'r': setActiveAction('rotate'); break;
        case 'd':
          e.preventDefault();
          compositionProps.onElementDuplicate?.(selectedEl.id);
          break;
        case 'backspace':
        case 'delete':
          if (!selectedEl.isBrandElement) {
            e.preventDefault();
            compositionProps.onElementDelete?.(selectedEl.id);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedElementId, timelineElements, setActiveAction, compositionProps]);

  // Reset to move when element is deselected
  useEffect(() => {
    if (!selectedElementId) setActiveAction('move');
  }, [selectedElementId, setActiveAction]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    } else {
      setSelectedElementId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  // Ref for native wheel handler (React onWheel is passive, can't preventDefault)
  const canvasRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomDelta = -e.deltaY * 0.008;
        setZoom(prev => {
          const next = Math.min(5, Math.max(0.1, prev + zoomDelta * prev));
          return Math.round(next * 100) / 100;
        });
      } else {
        setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  const selectedElement = timelineElements?.find(el => el.id === selectedElementId);

  const handleUpdateSelected = (updates: Partial<TimelineElement>) => {
    if (setTimelineElements && selectedElementId) {
      setTimelineElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, ...updates } : el));
    }
  };

  const handleTextEditComplete = () => {
    setEditingTextId(null);
  };

  const { layers, setLayers, setActiveLayerId } = useEditor();

  // ═══ Drop handler for canvas ═══
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (!data || !setTimelineElements) return;

    try {
      const parsed = JSON.parse(data);
      if (!parsed.type || !parsed.src) return;

      // Calculate drop position relative to canvas
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - canvasRect.left) / canvasRect.width) * 100);
      const y = Math.round(((e.clientY - canvasRect.top) / canvasRect.height) * 100);
      const currentFrame = playerRef.current?.getCurrentFrame() || 0;

      const elementType = parsed.type === 'sticker' ? 'image'
        : (parsed.type === 'images' || parsed.type === 'image') ? 'image'
        : parsed.type === 'video' ? 'video'
        : parsed.type === 'audio' ? 'audio'
        : 'image';

      // Determine target layer based on element type
      let targetLayerId = activeLayerId || 'layer-1';
      const activeLayer = layers.find(l => l.id === activeLayerId);

      // Brand layer never accepts new elements — route to correct layer
      const isIncompatibleLayer = activeLayer?.type === 'brand' 
        || (elementType === 'video' && activeLayer?.type !== 'video')
        || (elementType === 'audio' && activeLayer?.type !== 'audio')
        || (elementType !== 'video' && elementType !== 'audio' && (activeLayer?.type === 'video' || activeLayer?.type === 'audio'));

      if (elementType === 'video' && (isIncompatibleLayer || activeLayer?.type !== 'video')) {
        let videoLayer = layers.find(l => l.type === 'video');
        if (!videoLayer) {
          const count = layers.filter(l => l.type === 'video').length + 1;
          videoLayer = { id: 'layer-' + Date.now(), name: `Capa de Video ${count}`, type: 'video' };
          setLayers(prev => [...prev, videoLayer!]);
        }
        targetLayerId = videoLayer.id;
        setActiveLayerId(targetLayerId);
      } else if (elementType === 'audio' && (isIncompatibleLayer || activeLayer?.type !== 'audio')) {
        let audioLayer = layers.find(l => l.type === 'audio');
        if (!audioLayer) {
          const count = layers.filter(l => l.type === 'audio').length + 1;
          audioLayer = { id: 'layer-' + Date.now(), name: `Capa de Audio ${count}`, type: 'audio', volume: 100 };
          setLayers(prev => [...prev, audioLayer!]);
        }
        targetLayerId = audioLayer.id;
        setActiveLayerId(targetLayerId);
      } else if (isIncompatibleLayer) {
        // Image/sticker → visual layer
        let visualLayer = layers.find(l => l.type === 'visual' || l.type == null);
        if (visualLayer) {
          targetLayerId = visualLayer.id;
          setActiveLayerId(targetLayerId);
        }
      }

      setTimelineElements(prev => [...prev, {
        id: 'el-' + Date.now(),
        layerId: targetLayerId,
        type: elementType,
        content: parsed.src,
        startFrame: currentFrame,
        endFrame: Math.min(durationInFrames, currentFrame + 100),
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
        scale: 1,
        originalFileName: parsed.fileName,
      }]);

      // Auto-detect audio duration and update endFrame
      if (elementType === 'audio') {
        getAudioDuration(parsed.src).then(dur => {
          const realEnd = currentFrame + durationToFrames(dur);
          setTimelineElements(p => p.map(el => 
            el.content === parsed.src && el.startFrame === currentFrame && el.type === 'audio'
              ? { ...el, endFrame: realEnd }
              : el
          ));
        }).catch(() => {});
      }
    } catch {}
  }, [setTimelineElements, activeLayerId, durationInFrames, playerRef, layers, setLayers, setActiveLayerId]);

  const getDimensions = () => {
    if (aspectRatio === '16:9') return { width: 1920, height: 1080 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    if (aspectRatio === '4:5') return { width: 1080, height: 1350 };
    if (aspectRatio === '4:3') return { width: 1440, height: 1080 };
    return { width: 1080, height: 1920 }; // 9:16
  };
  const dimensions = getDimensions();

  return (
    <main 
      ref={canvasRef}
      className={`flex-1 relative flex flex-col justify-center items-center p-4 overflow-hidden checkerboard-bg ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''} ${isDragOver ? 'drop-zone-active' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Player controls toggle — video only, top-right small */}
      {outputFormat !== 'image' && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {/* Safe Area toggle */}
          {aspectRatio === '9:16' && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setSafeAreaPlatform(prev => prev ? null : 'tiktok'); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${safeAreaPlatform ? 'bg-amber-600/80 text-white' : 'bg-neutral-800/60 hover:bg-neutral-700/60 text-neutral-400'}`}
                title="Safe Area"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2 2" /></svg>
              </button>
              {safeAreaPlatform && (
                <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1 shadow-xl min-w-[120px]">
                  {Object.entries(SAFE_AREAS).map(([key, sa]) => (
                    <button
                      key={key}
                      onClick={(e) => { e.stopPropagation(); setSafeAreaPlatform(key as keyof typeof SAFE_AREAS); }}
                      className={`block w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${safeAreaPlatform === key ? 'bg-amber-600/30 text-amber-200' : 'text-neutral-300 hover:bg-neutral-800'}`}
                    >
                      {sa.label}
                    </button>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSafeAreaPlatform(null); }}
                    className="block w-full text-left px-2 py-1 rounded text-[10px] text-rose-400 hover:bg-neutral-800"
                  >
                    Desactivar
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowControls(!showControls); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${showControls ? 'bg-violet-600/80 text-white' : 'bg-neutral-800/60 hover:bg-neutral-700/60 text-neutral-400'}`}
            title={showControls ? "Ocultar Controles" : "Mostrar Controles"}
          >
            <PlaySquare size={12} />
          </button>
        </div>
      )}

      {/* ═══ Fixed Action Toolbar — above canvas ═══ */}
      {selectedElementId && (() => {
        const selectedEl = timelineElements?.find(el => el.id === selectedElementId);
        if (!selectedEl) return null;
        const isInteractive = (!!activeLayerId && selectedEl.layerId === activeLayerId) && !selectedEl.isLocked;
        if (!isInteractive) return null;

        // Keyframe state
        const currentFrame = playerRef.current?.getCurrentFrame() ?? 0;
        const kfs = selectedEl.keyframes ?? [];
        const hasKeyframes = kfs.length > 0;
        const kfAtFrame = kfs.find(kf => Math.abs(kf.frame - currentFrame) <= 2);
        const hasKeyframeAtCurrentFrame = !!kfAtFrame;

        const handleToggleKeyframe = () => {
          if (!setTimelineElements) return;
          setTimelineElements(prev => prev.map(el => {
            if (el.id !== selectedEl.id) return el;
            const existing = (el.keyframes ?? []);
            const atIdx = existing.findIndex(kf => Math.abs(kf.frame - currentFrame) <= 2);
            if (atIdx >= 0) {
              // Remove keyframe
              const newKfs = existing.filter((_, i) => i !== atIdx);
              return { ...el, keyframes: newKfs.length > 0 ? newKfs : undefined };
            } else {
              // Add keyframe with current element values
              const newKf = {
                frame: currentFrame,
                x: el.x,
                y: el.y,
                scale: el.scale ?? 1,
                opacity: el.opacity ?? 1,
                rotation: el.rotation ?? 0,
                easing: 'ease-in-out' as const,
              };
              // If no keyframes yet, also add one at startFrame with current values
              if (existing.length === 0) {
                const startKf = { ...newKf, frame: el.startFrame, easing: 'linear' as const };
                return { ...el, keyframes: [startKf, newKf].sort((a, b) => a.frame - b.frame) };
              }
              return { ...el, keyframes: [...existing, newKf].sort((a, b) => a.frame - b.frame) };
            }
          }));
        };

        const handlePrevKeyframe = () => {
          const prev = [...kfs].filter(kf => kf.frame < currentFrame - 2).sort((a, b) => b.frame - a.frame);
          if (prev.length > 0) playerRef.current?.seekTo(prev[0].frame);
        };

        const handleNextKeyframe = () => {
          const next = [...kfs].filter(kf => kf.frame > currentFrame + 2).sort((a, b) => a.frame - b.frame);
          if (next.length > 0) playerRef.current?.seekTo(next[0].frame);
        };

        return (
          <div 
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ElementActionToolbar
              activeAction={activeAction}
              setActiveAction={setActiveAction}
              isLocked={!!selectedEl.isLocked}
              isBrandElement={!!selectedEl.isBrandElement}
              onDuplicate={() => compositionProps.onElementDuplicate?.(selectedEl.id)}
              onDelete={() => compositionProps.onElementDelete?.(selectedEl.id)}
              onLock={() => compositionProps.onElementLock?.(selectedEl.id)}
              hasKeyframes={hasKeyframes}
              hasKeyframeAtCurrentFrame={hasKeyframeAtCurrentFrame}
              onToggleKeyframe={handleToggleKeyframe}
              onPrevKeyframe={handlePrevKeyframe}
              onNextKeyframe={handleNextKeyframe}
            />
          </div>
        );
      })()}

      <div 
        className={`relative ${activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'} h-full w-full max-h-full flex items-center justify-center`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElementId(null);
          setShowContextMenu(false);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <div 
          className={`relative flex items-center justify-center ${isPanning ? '' : 'transition-transform duration-100 ease-out'}`}
          style={{ 
            height: '100%', 
            maxHeight: '100%', 
            maxWidth: '100%', 
            aspectRatio: `${dimensions.width} / ${dimensions.height}`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <CanvasWorkspace
            aspectRatio={`${dimensions.width} / ${dimensions.height}`}
            isEditing={!!selectedElementId}
            className=""
            canvasClassName="rounded"
            overlay={selectedElementId ? (
              <>
                {/* Text editor overlay */}
                {editingTextId && selectedElement && selectedElement.type === 'text' && (
                  <div 
                    className="absolute z-30"
                    style={{
                      left: `${selectedElement.x}%`,
                      top: `${selectedElement.y}%`,
                      transform: `translate(-50%, -50%) scale(${selectedElement.scale ?? 1})`,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <textarea
                      autoFocus
                      value={selectedElement.content}
                      onChange={(e) => handleUpdateSelected({ content: e.target.value })}
                      onBlur={handleTextEditComplete}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleTextEditComplete();
                        }
                        e.stopPropagation();
                      }}
                      className="bg-transparent border-2 border-violet-500 rounded-lg p-2 outline-none resize-none text-center"
                      style={{
                        fontFamily: selectedElement.fontFamily ?? compositionProps.designMD.baseFont,
                        color: selectedElement.color ?? compositionProps.designMD.textColor,
                        fontSize: `calc(${(selectedElement.fontSize || 56)}px * (100vh / 1920) * 0.8)`,
                        textShadow: `${selectedElement.shadowOffset ?? 3}px ${selectedElement.shadowOffset ?? 3}px ${selectedElement.shadowBlur ?? 6}px rgba(0,0,0,0.8)`,
                        width: '600px',
                        minHeight: '200px',
                        lineHeight: '1.2',
                        pointerEvents: 'auto',
                      }}
                    />
                  </div>
                )}

                {/* Context menu overlay */}
                {selectedElement && showContextMenu && (
                  <div 
                    className="absolute z-20 flex items-center gap-4 bg-[#111] border border-neutral-800 shadow-2xl px-5 py-3 rounded-2xl backdrop-blur-xl transition-all duration-75"
                    style={{
                      left: `${selectedElement.x}%`,
                      top: `calc(${selectedElement.y}% + 4rem)`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'auto',
                    }}
                    onClick={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                  >
                    {selectedElement.type === 'text' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Color</label>
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-700/50">
                            <input 
                              type="color" 
                              value={selectedElement.color || compositionProps.designMD.textColor}
                              onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer bg-transparent border-0"
                            />
                          </div>
                        </div>
                        
                        <div className="w-[1px] h-10 bg-neutral-800/80 mx-1"></div>

                        <div className="flex flex-col gap-1.5 w-24">
                          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Tamaño</label>
                          <input 
                            type="number" 
                            value={selectedElement.fontSize || 56}
                            onChange={(e) => handleUpdateSelected({ fontSize: Number(e.target.value) })}
                            className="w-full bg-[#1A1A1A] text-sm text-white px-3 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors"
                          />
                        </div>

                        <div className="w-[1px] h-10 bg-neutral-800/80 mx-1"></div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Fuente</label>
                          <select 
                            value={selectedElement.fontFamily || compositionProps.designMD.baseFont}
                            onChange={(e) => handleUpdateSelected({ fontFamily: e.target.value })}
                            className="bg-[#1A1A1A] text-sm text-white px-3 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors min-w-[140px]"
                          >
                            <option value="system-ui, sans-serif">System Default</option>
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'sticker' && (
                      <>
                        <div className="flex flex-col gap-1.5 w-24">
                          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Escala</label>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0.1"
                            value={selectedElement.scale ?? 1}
                            onChange={(e) => handleUpdateSelected({ scale: Number(e.target.value) })}
                            className="w-full bg-[#1A1A1A] text-sm text-white px-3 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors"
                          />
                        </div>

                         <div className="w-[1px] h-10 bg-neutral-800/80 mx-1"></div>

                        <div className="flex flex-col gap-1.5 w-24">
                          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Opacidad</label>
                          <input 
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={selectedElement.opacity ?? 1}
                            onChange={(e) => handleUpdateSelected({ opacity: Number(e.target.value) })}
                            className="w-full bg-[#1A1A1A] text-sm text-white px-3 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : undefined}
          >
            <Player
              ref={playerRef}
              component={BrandComposition}
              inputProps={{ 
                ...compositionProps, 
                onElementClick: (id) => {
                  setShowContextMenu(false);
                  if (editingTextId !== id) {
                    setEditingTextId(null);
                  }
                  if (compositionProps.onElementClick) {
                    compositionProps.onElementClick(id);
                  }
                },
                onElementContextMenu: (id) => {
                  setSelectedElementId(id);
                  setShowContextMenu(true);
                },
                onElementDoubleClick: (id) => {
                  const element = timelineElements?.find(el => el.id === id);
                  if (element?.type === 'text') {
                    setSelectedElementId(id);
                    setEditingTextId(id);
                    setShowContextMenu(false);
                  }
                }
              }}
              durationInFrames={durationInFrames}
              compositionWidth={dimensions.width}
              compositionHeight={dimensions.height}
              fps={30}
              controls={outputFormat !== 'image' && showControls}
              clickToPlay={false}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '4px',
                pointerEvents: isSpacePressed || isPanning ? 'none' : 'auto',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            />
            {/* Safe Area Overlay */}
            {safeAreaPlatform && SAFE_AREAS[safeAreaPlatform] && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, borderRadius: '4px', overflow: 'hidden' }}>
                {/* Top danger zone */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${SAFE_AREAS[safeAreaPlatform].top}%`, background: 'rgba(245, 158, 11, 0.15)', borderBottom: '1px dashed rgba(245, 158, 11, 0.6)' }} />
                {/* Bottom danger zone */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${SAFE_AREAS[safeAreaPlatform].bottom}%`, background: 'rgba(245, 158, 11, 0.15)', borderTop: '1px dashed rgba(245, 158, 11, 0.6)' }} />
                {/* Left danger zone */}
                <div style={{ position: 'absolute', top: `${SAFE_AREAS[safeAreaPlatform].top}%`, bottom: `${SAFE_AREAS[safeAreaPlatform].bottom}%`, left: 0, width: `${SAFE_AREAS[safeAreaPlatform].left}%`, background: 'rgba(245, 158, 11, 0.08)' }} />
                {/* Right danger zone */}
                <div style={{ position: 'absolute', top: `${SAFE_AREAS[safeAreaPlatform].top}%`, bottom: `${SAFE_AREAS[safeAreaPlatform].bottom}%`, right: 0, width: `${SAFE_AREAS[safeAreaPlatform].right}%`, background: 'rgba(245, 158, 11, 0.08)' }} />
                {/* Label */}
                <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', background: 'rgba(245, 158, 11, 0.9)', color: '#000', fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>
                  {SAFE_AREAS[safeAreaPlatform].label} Safe Area
                </div>
              </div>
            )}
          </CanvasWorkspace>
        </div>
      </div>
    </main>
  );
};
