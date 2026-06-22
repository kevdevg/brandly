import React, { useState, useEffect, useRef, RefObject } from 'react';
import { Layers, GripVertical } from 'lucide-react';
import { TimelineElement, TimelineLayer, DesignMD } from '../types';
import { PlayerRef } from '@remotion/player';
import { DragState, getTrackBgClass } from './timeline/timelineUtils';
import { TimelineControls } from './timeline/TimelineControls';
import { TimelineRuler } from './timeline/TimelineRuler';
import { TimelinePlayhead } from './timeline/TimelinePlayhead';
import { TimelineTrackElement } from './timeline/TimelineTrackElement';
import { TimelineLayerLabels } from './timeline/TimelineLayerLabels';
import { LayerContextMenu } from './timeline/LayerContextMenu';
import { ElementContextMenu } from './timeline/ElementContextMenu';
import { insertSceneTemplate, SceneTemplate } from '../config/sceneTemplates';
import { getAudioDuration, durationToFrames } from '../utils/audioMetadata';

interface StudioTimelineProps {
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
  timeUnit: 'frames' | 'seconds';
  setTimeUnit: (unit: 'frames' | 'seconds') => void;
  durationInFrames: number;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  layers: TimelineLayer[];
  setLayers: React.Dispatch<React.SetStateAction<TimelineLayer[]>>;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  playerRef: RefObject<PlayerRef | null>;
  activeTool: 'select' | 'text' | 'sticker' | 'media' | 'transitions';
  outputFormat?: 'video' | 'image';
  designMD?: DesignMD;
  selectedElementIds?: Set<string>;
  toggleElementSelection?: (id: string, multi?: boolean) => void;
}

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  timelineZoom,
  setTimelineZoom,
  timeUnit,
  setTimeUnit,
  durationInFrames,
  timelineElements,
  setTimelineElements,
  layers,
  setLayers,
  activeLayerId,
  setActiveLayerId,
  selectedElementId,
  setSelectedElementId,
  playerRef,
  activeTool,
  outputFormat,
  designMD,
  selectedElementIds,
  toggleElementSelection,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragMousePos, setDragMousePos] = useState<{ x: number, y: number } | null>(null);
  const [layerContextMenu, setLayerContextMenu] = useState<{ layerId: string, x: number, y: number } | null>(null);
  const [elementContextMenu, setElementContextMenu] = useState<{ elementId: string, x: number, y: number } | null>(null);
  const [snapGuideFrame, setSnapGuideFrame] = useState<number | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);

  const transparentImg = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    transparentImg.current = img;

    const handleClickOutside = () => setLayerContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // ═══ Playhead Auto-scroll ═══
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    let isPlaying = false;
    let rafId: number | null = null;

    const handlePlay = () => { isPlaying = true; };
    const handlePause = () => { isPlaying = false; };

    const checkScroll = () => {
      if (!isPlaying || !scrollContainerRef.current || !timelineRef.current) {
        rafId = requestAnimationFrame(checkScroll);
        return;
      }

      const currentFrame = player.getCurrentFrame();
      const scrollEl = scrollContainerRef.current;
      const trackWidth = timelineRef.current.offsetWidth;
      const playheadX = (currentFrame / durationInFrames) * trackWidth;

      const viewportLeft = scrollEl.scrollLeft;
      const viewportRight = viewportLeft + scrollEl.clientWidth;
      const margin = scrollEl.clientWidth * 0.15; // 15% lookahead margin

      if (playheadX > viewportRight - margin || playheadX < viewportLeft + margin * 0.3) {
        scrollEl.scrollTo({
          left: playheadX - scrollEl.clientWidth * 0.3,
          behavior: 'smooth',
        });
      }

      rafId = requestAnimationFrame(checkScroll);
    };

    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('ended', handlePause);
    rafId = requestAnimationFrame(checkScroll);

    return () => {
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('ended', handlePause);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [playerRef, durationInFrames]);

  const toggleLayer = (layerId: string) => {
    setExpandedLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // --- Layer Drag & Drop ---
  const handleDragLayerStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    if (transparentImg.current) {
      e.dataTransfer.setDragImage(transparentImg.current, 0, 0);
    }
    setTimeout(() => setDraggedLayerId(id), 0);
  };

  const handleDropLayer = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) {
      setDraggedLayerId(null);
      return;
    }
    const oldIndex = layers.findIndex(l => l.id === draggedLayerId);
    const newIndex = layers.findIndex(l => l.id === targetId);
    if (oldIndex === -1 || newIndex === -1) {
      setDraggedLayerId(null);
      return;
    }
    const newLayers = [...layers];
    const [removed] = newLayers.splice(oldIndex, 1);
    newLayers.splice(newIndex, 0, removed);
    setLayers(newLayers);
    setDraggedLayerId(null);
  };

  // --- Layer Actions ---
  const handleToggleLayerLock = (layerId: string) => {
    setLayers(layers.map(l => l.id === layerId ? { ...l, isLocked: !l.isLocked } : l));
    setLayerContextMenu(null);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layerToDup = layers.find(l => l.id === layerId);
    if (!layerToDup) return;
    const newLayerId = 'layer-' + Date.now();
    const newLayer = { ...layerToDup, id: newLayerId, name: `${layerToDup.name} (Copia)` };
    const layerElements = timelineElements.filter(el => el.layerId === layerId);
    const newElements = layerElements.map(el => ({ ...el, id: el.id + '-copy-' + Date.now(), layerId: newLayerId }));
    
    const layerIndex = layers.findIndex(l => l.id === layerId);
    const newLayers = [...layers];
    newLayers.splice(layerIndex + 1, 0, newLayer);
    setLayers(newLayers);
    setTimelineElements([...timelineElements, ...newElements]);
    setLayerContextMenu(null);
  };

  const handleDeleteLayer = (layerId: string) => {
    setLayers(layers.filter(l => l.id !== layerId));
    setTimelineElements(timelineElements.filter(el => el.layerId !== layerId));
    if (activeLayerId === layerId) {
      const remaining = layers.filter(l => l.id !== layerId);
      const fallback = remaining.find(l => l.type !== 'brand') || remaining[0];
      if (fallback) setActiveLayerId(fallback.id);
    }
    setLayerContextMenu(null);
  };

  // --- Playhead Scrubbing ---
  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !playerRef.current) return;
    setIsDraggingPlayhead(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const frame = Math.round(percentage * durationInFrames);
    playerRef.current.seekTo(frame);
  };

  const handleRulerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPlayhead || !timelineRef.current || !playerRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const frame = Math.round(percentage * durationInFrames);
    playerRef.current.seekTo(frame);
  };

  const handleRulerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingPlayhead(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Stable refs for drag handler to prevent effect re-runs mid-drag
  const durationRef = useRef(durationInFrames);
  durationRef.current = durationInFrames;
  const setElementsRef = useRef(setTimelineElements);
  setElementsRef.current = setTimelineElements;

  // --- Element Drag (move/resize) ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !timelineRef.current) return;
      
      const containerWidth = timelineRef.current.clientWidth;
      const dur = durationRef.current;
      const pxPerFrame = containerWidth / dur;
      const deltaPx = e.clientX - dragState.startX;
      const deltaFrames = Math.round(deltaPx / pxPerFrame);
      
      setElementsRef.current(prev => {
        const draggingId = dragState.id;
        const element = prev.find(el => el.id === draggingId);
        if (!element) return prev;
        
        let newStart = element.startFrame;
        let newEnd = element.endFrame;

        if (dragState.type === 'move') {
          const duration = dragState.initialEndFrame - dragState.initialStartFrame;
          newStart = dragState.initialStartFrame + deltaFrames;
          newEnd = newStart + duration;
        } else if (dragState.type === 'resize-start') {
          newStart = dragState.initialStartFrame + deltaFrames;
        } else if (dragState.type === 'resize-end') {
          newEnd = dragState.initialEndFrame + deltaFrames;
        }

        // Snapping
        const SNAP_THRESHOLD_PX = 10;
        const dynamicSnapThreshold = Math.max(2, Math.round(SNAP_THRESHOLD_PX / pxPerFrame));
        const snapPoints: number[] = [0, dur];
        
        if (playerRef.current) {
          const playhead = playerRef.current.getCurrentFrame();
          if (playhead !== null) snapPoints.push(playhead);
        }
        
        prev.forEach(el => {
          if (el.id !== draggingId && el.layerId === element.layerId) {
            snapPoints.push(el.startFrame, el.endFrame);
          }
        });

        let closestStartSnap = Infinity;
        let closestEndSnap = Infinity;

        for (const sp of snapPoints) {
          if (Math.abs(sp - newStart) < Math.abs(closestStartSnap)) closestStartSnap = sp - newStart;
          if (Math.abs(sp - newEnd) < Math.abs(closestEndSnap)) closestEndSnap = sp - newEnd;
        }

        let activeSnapFrame: number | null = null;
        
        if (dragState.type === 'move') {
           if (Math.abs(closestStartSnap) <= dynamicSnapThreshold && Math.abs(closestStartSnap) <= Math.abs(closestEndSnap)) {
              newStart += closestStartSnap;
              newEnd = newStart + (dragState.initialEndFrame - dragState.initialStartFrame);
              activeSnapFrame = newStart;
           } else if (Math.abs(closestEndSnap) <= dynamicSnapThreshold) {
              newEnd += closestEndSnap;
              newStart = newEnd - (dragState.initialEndFrame - dragState.initialStartFrame);
              activeSnapFrame = newEnd;
           }
        } else if (dragState.type === 'resize-start' && Math.abs(closestStartSnap) <= dynamicSnapThreshold) {
           newStart += closestStartSnap;
           if (newStart >= newEnd) newStart = newEnd - 1;
           activeSnapFrame = newStart;
        } else if (dragState.type === 'resize-end' && Math.abs(closestEndSnap) <= dynamicSnapThreshold) {
           newEnd += closestEndSnap;
           if (newEnd <= newStart) newEnd = newStart + 1;
           activeSnapFrame = newEnd;
        }
        
        setTimeout(() => setSnapGuideFrame(activeSnapFrame), 0);

        if (dragState.type === 'move') {
          const duration = dragState.initialEndFrame - dragState.initialStartFrame;
          newStart = Math.max(0, Math.min(dur - duration, newStart));
          newEnd = Math.max(duration, Math.min(dur, newEnd));
        } else if (dragState.type === 'resize-start') {
          newStart = Math.max(0, Math.min(dragState.initialEndFrame - 1, newStart));
        } else if (dragState.type === 'resize-end') {
          newEnd = Math.max(newStart + 1, Math.min(dur, newEnd));
        }

        // Cross-layer dragging: detect vertical movement
        let newLayerId = element.layerId;
        if (dragState.type === 'move' && dragState.startY) {
          const deltaY = e.clientY - dragState.startY;
          const LAYER_HEIGHT = 40; // approximate height of each track row
          if (Math.abs(deltaY) > LAYER_HEIGHT * 0.5) {
            const layerSteps = Math.round(deltaY / LAYER_HEIGHT);
            const initialLayerIdx = sortedTrackLayers.findIndex(l => l.id === (dragState.initialLayerId || element.layerId));
            const targetIdx = Math.max(0, Math.min(sortedTrackLayers.length - 1, initialLayerIdx + layerSteps));
            const targetLayer = sortedTrackLayers[targetIdx];
            if (targetLayer && targetLayer.id !== element.layerId && targetLayer.type !== 'brand') {
              newLayerId = targetLayer.id;
            }
          }
        }

        if (newStart === element.startFrame && newEnd === element.endFrame && newLayerId === element.layerId) return prev;
        return prev.map(el => el.id === draggingId ? { ...el, startFrame: newStart, endFrame: newEnd, layerId: newLayerId } : el);
      });
    };
    
    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
        setSnapGuideFrame(null);
      }
    };
    
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  // --- Split Element ---
  const handleSplitElement = () => {
    if (!selectedElementId || !playerRef.current) return;
    const currentFrame = playerRef.current.getCurrentFrame() || 0;
    const element = timelineElements.find(el => el.id === selectedElementId);
    if (element && currentFrame > element.startFrame && currentFrame < element.endFrame) {
      const el1 = { ...element, endFrame: currentFrame };
      const el2 = { ...element, id: Date.now().toString(), startFrame: currentFrame };
      setTimelineElements(prev => prev.map(el => el.id === selectedElementId ? el1 : el).concat(el2));
      setSelectedElementId(el2.id); 
    }
  };

  // Split & Marker keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSplitElement();
      } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const frame = playerRef.current?.getCurrentFrame() ?? 0;
        setMarkers(prev => {
          const existing = prev.findIndex(m => Math.abs(m - frame) < 3);
          if (existing >= 0) {
            // Remove marker
            return prev.filter((_, i) => i !== existing);
          }
          // Add marker
          return [...prev, frame].sort((a, b) => a - b);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, timelineElements, playerRef]);

  // --- Sorted layers for track display ---
  const sortedTrackLayers = [
    ...layers.filter(l => l.type === 'brand'),
    ...layers.filter(l => l.type === 'background'),
    ...layers.filter(l => outputFormat !== 'image' && l.type === 'video'),
    ...layers.filter(l => outputFormat !== 'image' && l.type === 'audio'),
    ...layers.filter(l => l.type === 'visual' || l.type == null)
  ];

  return (
    <div className="StudioTimeline h-64 bg-neutral-900 border-t border-neutral-800 flex flex-col shrink-0 overflow-hidden shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
       <TimelineControls
         timelineZoom={timelineZoom}
         setTimelineZoom={setTimelineZoom}
         timeUnit={timeUnit}
         setTimeUnit={setTimeUnit}
         durationInFrames={durationInFrames}
         selectedElementId={selectedElementId}
         onSplit={handleSplitElement}
         outputFormat={outputFormat}
         onInsertTemplate={(template: SceneTemplate) => {
           const frame = playerRef.current?.getCurrentFrame() ?? 0;
           const newElements = insertSceneTemplate(template, activeLayerId, frame);
           setTimelineElements(prev => [...prev, ...newElements]);
           if (newElements.length > 0) setSelectedElementId(newElements[0].id);
         }}
       />
       
       {/* Tracks Header & Timeline Ruler Container */}
       <div className="flex-1 overflow-hidden flex relative">
          {/* Track Labels (Left Side) */}
          <TimelineLayerLabels
            layers={layers}
            setLayers={setLayers}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            expandedLayers={expandedLayers}
            toggleLayer={toggleLayer}
            draggedLayerId={draggedLayerId}
            onDragLayerStart={handleDragLayerStart}
            onDropLayer={handleDropLayer}
            setDraggedLayerId={setDraggedLayerId}
            setDragMousePos={setDragMousePos}
            setLayerContextMenu={setLayerContextMenu}
            playerRef={playerRef}
            outputFormat={outputFormat}
            durationInFrames={durationInFrames}
            designMD={designMD}
          />

          {/* Tracks Content (Scrollable) */}
          {outputFormat !== 'image' && (
          <div ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] bg-neutral-950/40">
             <div 
               ref={timelineRef} 
               className="relative min-h-full pb-8 select-none cursor-text" 
               style={{ width: `${Math.max(100, timelineZoom * 100)}%`, minWidth: '100%' }}
               onPointerDown={(e) => {
                 if (e.target === e.currentTarget) {
                   handleRulerPointerDown(e);
                 }
               }}
               onPointerMove={isDraggingPlayhead ? handleRulerPointerMove : undefined}
               onPointerUp={isDraggingPlayhead ? handleRulerPointerUp : undefined}
             >
                {/* Ruler */}
                <TimelineRuler
                  timeUnit={timeUnit}
                  durationInFrames={durationInFrames}
                  onPointerDown={handleRulerPointerDown}
                  onPointerMove={handleRulerPointerMove}
                  onPointerUp={handleRulerPointerUp}
                />

                {/* Playhead */}
                <TimelinePlayhead
                  playerRef={playerRef}
                  durationInFrames={durationInFrames}
                  onPointerDown={handleRulerPointerDown}
                  onPointerMove={handleRulerPointerMove}
                  onPointerUp={handleRulerPointerUp}
                  isDraggingPlayhead={isDraggingPlayhead}
                />

                {/* Snap Guide */}
                {snapGuideFrame !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-yellow-400 z-20 shadow-[0_0_8px_rgba(250,204,21,0.8)] pointer-events-none"
                    style={{ left: `${(snapGuideFrame / durationInFrames) * 100}%` }}
                  />
                )}

                {/* Markers */}
                {markers.map((frame, idx) => (
                  <div
                    key={`marker-${idx}`}
                    className="absolute top-0 bottom-0 z-15 pointer-events-none"
                    style={{ left: `${(frame / durationInFrames) * 100}%` }}
                  >
                    {/* Marker head (triangle) */}
                    <div className="absolute top-0 -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #34d399' }} />
                    {/* Marker line */}
                    <div className="absolute top-1.5 bottom-0 w-px bg-emerald-400/30" style={{ left: 0 }} />
                  </div>
                ))}

                {/* Tracks */}
                <div className="py-2 space-y-2 w-full">
                  {sortedTrackLayers.map(layer => {
                    const isExpanded = expandedLayers[layer.id];
                    const layerElements = timelineElements.filter(el => el.layerId === layer.id);

                    return (
                      <div key={`layer-track-group-${layer.id}`} className={`flex flex-col gap-2 rounded-l -ml-1 pl-1 ${getTrackBgClass(layer.colorLabel)}`}>
                        <div 
                          className="relative h-8 w-full group"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                              try {
                                const parsed = JSON.parse(data);
                                if (parsed.type && parsed.src) {
                                  const elementType = parsed.type === 'sticker' ? 'image' : (parsed.type === 'images' || parsed.type === 'image') ? 'image' : parsed.type === 'video' ? 'video' : parsed.type === 'audio' ? 'audio' : 'image';

                                  // Validate layer compatibility
                                  if (layer.type === 'brand') return; // Brand never accepts drops
                                  if (layer.type === 'video' && elementType !== 'video') return;
                                  if (layer.type === 'audio' && elementType !== 'audio') return;
                                  if ((layer.type === 'visual' || layer.type == null) && (elementType === 'video' || elementType === 'audio')) return;

                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                                  const frame = Math.round(percentage * durationInFrames);
                                  
                                  setTimelineElements(prev => [...prev, {
                                    id: 'el-' + Date.now(),
                                    layerId: layer.id,
                                    type: elementType,
                                    content: parsed.src,
                                    startFrame: frame,
                                    endFrame: Math.min(durationInFrames, frame + 60),
                                    x: 0,
                                    y: 0,
                                    scale: 1,
                                    originalFileName: parsed.fileName,
                                  }]);

                                  // Auto-detect audio duration and update endFrame
                                  if (elementType === 'audio') {
                                    const elId = 'el-' + Date.now();
                                    getAudioDuration(parsed.src).then(dur => {
                                      const realEnd = frame + durationToFrames(dur);
                                      setTimelineElements(p => p.map(el => 
                                        el.content === parsed.src && el.startFrame === frame && el.type === 'audio'
                                          ? { ...el, endFrame: realEnd }
                                          : el
                                      ));
                                    }).catch(() => {});
                                  }
                                }
                              } catch (err) {}
                            }
                          }}
                        >
                          {/* Track Background Line */}
                          <div className="absolute top-1/2 w-full h-px bg-neutral-800/30 transform -translate-y-1/2"></div>
                          {!isExpanded && layerElements.map(el => (
                            <TimelineTrackElement
                              key={`track-${el.id}`}
                              element={el}
                              layer={layer}
                              layerElements={layerElements}
                              durationInFrames={durationInFrames}
                              selectedElementId={selectedElementId}
                              dragState={dragState}
                              activeTool={activeTool}
                              setSelectedElementId={setSelectedElementId}
                              setActiveLayerId={setActiveLayerId}
                              setDragState={setDragState}
                              setTimelineElements={setTimelineElements}
                              setElementContextMenu={setElementContextMenu}
                              playerRef={playerRef}
                              timelineElements={timelineElements}
                              selectedElementIds={selectedElementIds}
                              toggleElementSelection={toggleElementSelection}
                            />
                          ))}
                        </div>
                        {isExpanded && (
                          <div className="flex flex-col gap-2">
                            {layerElements.map((el, elIdx) => (
                              <div key={`track-el-${el.id}`} className="relative h-8 w-full group flex items-center">
                                <div className="absolute top-1/2 w-full h-px bg-neutral-800/20 transform -translate-y-1/2"></div>
                                <div className="sticky left-4 z-[5] w-fit flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <span className="text-[9px] text-neutral-400 font-mono font-medium bg-neutral-900/90 w-4 h-4 flex items-center justify-center rounded border border-neutral-800 shadow-sm backdrop-blur-md">
                                    {elIdx + 1}
                                  </span>
                                  <span className="text-[9px] text-neutral-400 font-medium bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-800 shadow-sm backdrop-blur-md">
                                    {layer.name}
                                  </span>
                                  <span className="text-[9px] text-neutral-600 font-medium truncate max-w-[150px]">
                                    {el.type === 'text' ? el.content : el.type === 'audio' ? 'Audio Track' : el.type === 'image' ? 'Imagen' : el.type === 'video' ? 'Video' : 'Sticker'}
                                  </span>
                                </div>
                                <TimelineTrackElement
                                  element={el}
                                  layer={layer}
                                  layerElements={layerElements}
                                  durationInFrames={durationInFrames}
                                  selectedElementId={selectedElementId}
                                  dragState={dragState}
                                  activeTool={activeTool}
                                  setSelectedElementId={setSelectedElementId}
                                  setActiveLayerId={setActiveLayerId}
                                  setDragState={setDragState}
                                  setTimelineElements={setTimelineElements}
                                  setElementContextMenu={setElementContextMenu}
                                  playerRef={playerRef}
                                  timelineElements={timelineElements}
                                  selectedElementIds={selectedElementIds}
                                  toggleElementSelection={toggleElementSelection}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
          )}
       </div>
       
       {/* Context Menu layer */}
       {layerContextMenu && (
         <LayerContextMenu
           layerContextMenu={layerContextMenu}
           layers={layers}
           setLayers={setLayers}
           onToggleLock={handleToggleLayerLock}
           onDuplicate={handleDuplicateLayer}
           onDelete={handleDeleteLayer}
           onClose={() => setLayerContextMenu(null)}
         />
       )}

        {/* Context Menu element */}
        {elementContextMenu && (() => {
          const ctxEl = timelineElements.find(e => e.id === elementContextMenu.elementId);
          if (!ctxEl) return null;
          return (
            <ElementContextMenu
              elementId={elementContextMenu.elementId}
              x={elementContextMenu.x}
              y={elementContextMenu.y}
              element={ctxEl}
              onClose={() => setElementContextMenu(null)}
              onDuplicate={(id) => {
                const src = timelineElements.find(e => e.id === id);
                if (!src || src.isBrandElement) return;
                const copy = { ...src, id: 'el-' + Date.now(), isBrandElement: false, isLocked: false };
                setTimelineElements(prev => [...prev, copy]);
                setSelectedElementId(copy.id);
              }}
              onDelete={(id) => {
                setTimelineElements(prev => prev.filter(e => e.id !== id));
                setSelectedElementId(null);
              }}
              onToggleLock={(id) => {
                setTimelineElements(prev => prev.map(e =>
                  e.id === id ? { ...e, isLocked: !e.isLocked } : e
                ));
              }}
              onSplit={(id) => {
                const splitEl = timelineElements.find(e => e.id === id);
                const frame = playerRef.current?.getCurrentFrame() ?? 0;
                if (splitEl && frame > splitEl.startFrame + 2 && frame < splitEl.endFrame - 2) {
                  const second = { ...splitEl, id: 'el-' + Date.now(), startFrame: frame, isBrandElement: false };
                  setTimelineElements(prev => {
                    const idx = prev.findIndex(e => e.id === id);
                    const arr = [...prev];
                    arr[idx] = { ...splitEl, endFrame: frame };
                    arr.splice(idx + 1, 0, second);
                    return arr;
                  });
                }
              }}
              onBringForward={(id) => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === id);
                  if (idx < 0 || idx === prev.length - 1) return prev;
                  const arr = [...prev];
                  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                  return arr;
                });
              }}
              onSendBackward={(id) => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === id);
                  if (idx <= 0) return prev;
                  const arr = [...prev];
                  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                  return arr;
                });
              }}
            />
          );
        })()}

       {/* Drag Ghost Indicator */}
       {draggedLayerId && dragMousePos && (
         <div 
           className="fixed pointer-events-none z-[100] w-64 bg-neutral-800/90 backdrop-blur-sm border border-neutral-600 rounded shadow-2xl flex items-center px-2 h-8 gap-1.5"
           style={{ left: dragMousePos.x + 15, top: dragMousePos.y + 15 }}
         >
           <GripVertical size={12} className="text-neutral-400" />
           <Layers size={12} className="text-neutral-300 shrink-0" />
           <span className="text-[10px] font-medium text-white truncate px-1">
             {layers.find(l => l.id === draggedLayerId)?.name || 'Capa'}
           </span>
         </div>
       )}

    </div>
  );
};
