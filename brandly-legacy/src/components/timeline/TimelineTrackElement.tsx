import React, { useRef, useState, useEffect } from 'react';
import { Type, Image as ImageIcon, Music, Lock } from 'lucide-react';
import { TimelineElement, TimelineLayer } from '../../types';
import { DragState } from './timelineUtils';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';
import { AudioVolumeOverlay } from './AudioVolumeOverlay';

interface TimelineTrackElementProps {
  element: TimelineElement;
  layer: TimelineLayer;
  layerElements: TimelineElement[];
  durationInFrames: number;
  selectedElementId: string | null;
  dragState: DragState | null;
  activeTool: 'select' | 'text' | 'sticker' | 'media' | 'transitions';
  setSelectedElementId: (id: string | null) => void;
  setActiveLayerId: (id: string) => void;
  setDragState: (state: DragState | null) => void;
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  setElementContextMenu: (menu: { elementId: string; x: number; y: number } | null) => void;
  playerRef: React.RefObject<any>;
  timelineElements: TimelineElement[];
  selectedElementIds?: Set<string>;
  toggleElementSelection?: (id: string, multi?: boolean) => void;
}

export const TimelineTrackElement: React.FC<TimelineTrackElementProps> = ({
  element: el,
  layer,
  layerElements,
  durationInFrames,
  selectedElementId,
  dragState,
  activeTool,
  setSelectedElementId,
  setActiveLayerId,
  setDragState,
  setTimelineElements,
  setElementContextMenu,
  playerRef,
  timelineElements,
  selectedElementIds,
  toggleElementSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width for canvas/overlay sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const leftStart = Math.max(0, (el.startFrame / durationInFrames) * 100);
  const widthPct = Math.max(0, ((Math.max(el.startFrame + 1, el.endFrame) - el.startFrame) / durationInFrames) * 100);
  const isSelected = selectedElementId === el.id || (selectedElementIds?.has(el.id) ?? false);
  const isDragging = dragState?.id === el.id;
  const opacityClass = (layer.isVisible === false || el.isHidden) ? 'opacity-40' : 'opacity-100';

  const handleUpdateElement = (updates: Partial<TimelineElement>) => {
    setTimelineElements(prev => prev.map(e => e.id === el.id ? { ...e, ...updates } : e));
  };
  
  const isOverlapping = layerElements.some(otherEl => 
    otherEl.id !== el.id && 
    el.startFrame < otherEl.endFrame && 
    el.endFrame > otherEl.startFrame
  );
  
  const baseColorClass = isOverlapping 
    ? 'bg-rose-500/50 border-rose-500/80 text-white !shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
    : el.isBrandElement ? 'bg-amber-600/30 border-amber-500/60 text-amber-100'
    : el.type === 'audio' ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-100'
    : el.type === 'text' ? 'bg-violet-600/30 border-violet-500/60 text-violet-100'
    : el.type === 'video' ? 'bg-sky-600/30 border-sky-500/60 text-sky-100'
    : 'bg-emerald-600/30 border-emerald-500/60 text-emerald-100';

  // Derive display name for audio clips
  const audioDisplayName = el.type === 'audio'
    ? (el.originalFileName || (el.content.startsWith('blob:') ? 'Audio' : 'Audio Track'))
    : '';

  return (
    <div 
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        // Shift+Click for multi-select
        if (e.shiftKey && toggleElementSelection) {
          toggleElementSelection(el.id, true);
        } else {
          setSelectedElementId(el.id);
        }
        setActiveLayerId(layer.id);
        const currentFrame = playerRef.current?.getCurrentFrame() ?? -1;
        if (currentFrame < el.startFrame || currentFrame >= el.endFrame) {
          playerRef.current?.seekTo(el.startFrame);
        }
      }}
      className={`group/seg absolute h-6 rounded border backdrop-blur-md flex items-center top-1 shadow-sm hover:z-50 transition-opacity duration-200 overflow-hidden ${opacityClass}
        ${baseColorClass}
        ${isSelected ? 'ring-1 ring-white/50 brightness-125 z-10' : ''}
         ${isDragging ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)] z-20' : ''}
      `}
      title={`${el.type.charAt(0).toUpperCase() + el.type.slice(1)}: ${el.type === 'text' ? (el.content?.slice(0, 30) || 'Texto') : (el.content?.split('/').pop()?.slice(0, 25) || el.type)} | ${((el.endFrame - el.startFrame) / 30).toFixed(1)}s (F${el.startFrame}–${el.endFrame})${el.isLocked ? ' 🔒' : ''}`}
      style={{ 
        left: `${leftStart}%`, 
        width: `${widthPct}%`, 
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'left 0.1s, width 0.1s' 
      }}
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
            
            // Reemplazo Rápido (not for brand elements)
            if (!el.isBrandElement && (parsed.type === 'image' || parsed.type === 'video' || parsed.type === 'sticker')) {
              if (el.type === 'sticker' || el.type === 'video' || el.type === 'image' || el.type === 'visual') {
                const newElements = [...timelineElements];
                const elIndex = newElements.findIndex(x => x.id === el.id);
                if (elIndex >= 0) {
                  newElements[elIndex] = {
                    ...newElements[elIndex],
                    type: parsed.type === 'sticker' ? 'image' : (parsed.type === 'image' || parsed.type === 'images') ? 'image' : parsed.type === 'video' ? 'video' : 'audio',
                    content: parsed.src
                  };
                  setTimelineElements(newElements);
                }
              }
              return;
            }
            
            // Transitions
            if (activeTool === 'transitions' && parsed.type) {
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeft = e.clientX - rect.left < rect.width / 2;
              
              const newElements = [...timelineElements];
              const elIndex = newElements.findIndex(x => x.id === el.id);
              if (isLeft) {
                if (parsed.type === 'none') {
                  delete newElements[elIndex].transitionIn;
                } else {
                  newElements[elIndex].transitionIn = { type: parsed.type, duration: 15 };
                }
              } else {
                if (parsed.type === 'none') {
                  delete newElements[elIndex].transitionOut;
                } else {
                  newElements[elIndex].transitionOut = { type: parsed.type, duration: 15 };
                }
              }
              setTimelineElements(newElements);
            }
          } catch (err) {}
        }
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        setSelectedElementId(el.id);
        setActiveLayerId(layer.id);
        const currentFrame = playerRef.current?.getCurrentFrame() ?? -1;
        if (currentFrame < el.startFrame || currentFrame >= el.endFrame) {
          playerRef.current?.seekTo(el.startFrame);
        }
        setDragState({ id: el.id, type: el.isBrandElement ? 'resize-end' : 'move', startX: e.clientX, startY: e.clientY, initialStartFrame: el.startFrame, initialEndFrame: el.endFrame, initialLayerId: el.layerId });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedElementId(el.id);
        setElementContextMenu({ elementId: el.id, x: e.clientX, y: e.clientY });
      }}
    >
      {el.type === 'audio' && containerWidth > 0 && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AudioWaveformCanvas
              src={el.content}
              width={containerWidth}
              height={24}
              color={isSelected ? 'rgba(129, 140, 248, 0.7)' : 'rgba(129, 140, 248, 0.45)'}
            />
          </div>
          {/* Volume envelope overlay (fade in/out + keyframes) */}
          {(el.fadeInFrames || el.fadeOutFrames || el.volumeKeyframes?.length) || isSelected ? (
            <AudioVolumeOverlay
              element={el}
              width={containerWidth}
              height={24}
              isSelected={isSelected}
              onUpdateElement={handleUpdateElement}
            />
          ) : null}
        </>
      )}
      {/* Thumbnail background for image/video clips */}
      {(el.type === 'image' || el.type === 'sticker') && el.content && (
        <div className="absolute inset-0 overflow-hidden rounded pointer-events-none">
          <img src={el.content} alt="" className="w-full h-full object-cover opacity-25" loading="lazy" />
        </div>
      )}
      {el.type === 'video' && el.content && (
        <div className="absolute inset-0 overflow-hidden rounded pointer-events-none bg-neutral-900">
          <video src={el.content} muted className="w-full h-full object-cover opacity-20" preload="metadata" />
        </div>
      )}
      
      {/* Left Resize Handle */}
      <div 
        className={`absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l hover:bg-white/40 z-10 transition-colors ${isSelected ? 'bg-white/20' : ''}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setSelectedElementId(el.id);
          setActiveLayerId(layer.id);
          playerRef.current?.seekTo(el.startFrame);
          setDragState({ id: el.id, type: 'resize-start', startX: e.clientX, startY: e.clientY, initialStartFrame: el.startFrame, initialEndFrame: el.endFrame, initialLayerId: el.layerId });
        }}
      />
      
      <span className="text-[10px] font-medium truncate pointer-events-none w-full px-3 leading-none opacity-80 flex items-center justify-between relative z-10">
        <span className="flex items-center gap-1">
          {el.isBrandElement && <Lock size={8} className="text-amber-400 shrink-0" />}
          {!el.isBrandElement && el.isLocked && <Lock size={8} className="text-red-400 shrink-0" />}
          {el.isHidden && <span className="text-neutral-600 text-[8px]" title="Oculto">👁</span>}
          {el.transitionIn && <div className="w-1.5 h-1.5 rounded-full bg-white/50" title={`In: ${el.transitionIn.type}`} />}
          {el.isBrandElement ? (
            <>
              {el.content.includes('intro') || el.startFrame === 0 ? 'Intro' : 'Outro'}
              {el.brandDisplayMode === 'overlay' && <span className="text-[8px] text-amber-500/60 ml-1">(OVR)</span>}
            </>
          ) : el.elementName ? el.elementName : el.type === 'text' ? el.content : el.type === 'audio' ? audioDisplayName : el.type === 'video' ? 'Video' : el.type === 'shape' ? 'Forma' : 'Sticker'}
        </span>
        {el.transitionOut && <div className="w-1.5 h-1.5 rounded-full bg-white/50" title={`Out: ${el.transitionOut.type}`} />}
      </span>

      {/* ═══ Keyframe Diamonds ═══ */}
      {el.keyframes && el.keyframes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {el.keyframes.map((kf, kfIdx) => {
            const clipDuration = el.endFrame - el.startFrame;
            if (clipDuration <= 0) return null;
            const pct = ((kf.frame - el.startFrame) / clipDuration) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div
                key={kfIdx}
                className="absolute top-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
                style={{ left: `${pct}%` }}
                title={`Keyframe @ frame ${kf.frame} (${kf.easing || 'linear'})`}
                onClick={(e) => {
                  e.stopPropagation();
                  playerRef.current?.seekTo(kf.frame);
                }}
              >
                <div
                  className="w-2 h-2 -ml-1 rotate-45 border border-white/80"
                  style={{
                    background: isSelected ? '#a78bfa' : 'rgba(167, 139, 250, 0.6)',
                    boxShadow: '0 0 4px rgba(167, 139, 250, 0.5)',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Right Resize Handle */}
      <div 
        className={`absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r hover:bg-white/40 z-10 transition-colors ${isSelected ? 'bg-white/20' : ''}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setSelectedElementId(el.id);
          setActiveLayerId(layer.id);
          playerRef.current?.seekTo(el.startFrame);
          setDragState({ id: el.id, type: 'resize-end', startX: e.clientX, startY: e.clientY, initialStartFrame: el.startFrame, initialEndFrame: el.endFrame, initialLayerId: el.layerId });
        }}
      />

      {/* Duration Tooltip */}
      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/seg:opacity-100 transition-opacity bg-neutral-900 border border-neutral-700 text-neutral-300 text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-[60] shadow-lg font-mono">
        {el.endFrame - el.startFrame}f / {((el.endFrame - el.startFrame) / 30).toFixed(1)}s
      </div>
    </div>
  );
};
