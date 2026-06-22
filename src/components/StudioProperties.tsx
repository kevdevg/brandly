import React, { RefObject } from 'react';
import { PlayerRef } from '@remotion/player';
import { Type, Image as ImageIcon, Trash2, Film, Upload, Wand2, Play, ImagePlus, Square, Plus } from 'lucide-react';
import { TimelineElement, MediaFilter, TimelineLayer, DesignMD } from '../types';
import { AudioLayerPanel } from './properties/AudioLayerPanel';
import { GraphicLayerPanel } from './properties/GraphicLayerPanel';
import { TransitionsPanel } from './properties/TransitionsPanel';
import { GlobalSettingsPanel } from './properties/GlobalSettingsPanel';
import { ElementPropertiesPanel } from './properties/ElementPropertiesPanel';
import { ImageLayersPanel } from './properties/ImageLayersPanel';
import { MultiSelectActions } from './properties/MultiSelectActions';
import { uploadMedia } from '../utils/mediaUploader';

interface StudioPropertiesProps {
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  layers: TimelineLayer[];
  timeUnit: 'frames' | 'seconds';
  textOverlay: string;
  setTextOverlay: (text: string) => void;
  activeLayerId: string;
  playerRef: RefObject<PlayerRef | null>;
  activeTool: 'select' | 'text' | 'sticker' | 'transitions' | 'media';
  designMD: DesignMD;
  outputFormat?: 'video' | 'image';
  onExportClick?: () => void;
  onShowRenderHistory?: () => void;
  showGrid?: boolean;
  setShowGrid?: (show: boolean) => void;
  showSafeZone?: boolean;
  setShowSafeZone?: (show: boolean) => void;
  selectedElementIds?: Set<string>;
  clearSelection?: () => void;
}

export const StudioProperties: React.FC<StudioPropertiesProps> = ({
  selectedElementId,
  setSelectedElementId,
  timelineElements,
  setTimelineElements,
  layers,
  timeUnit,
  textOverlay,
  setTextOverlay,
  activeLayerId,
  playerRef,
  activeTool,
  designMD,
  outputFormat,
  onExportClick,
  onShowRenderHistory,
  showGrid,
  setShowGrid,
  showSafeZone,
  setShowSafeZone,
  selectedElementIds,
  clearSelection,
}) => {
  const selectedElementIndex = timelineElements.findIndex(s => s.id === selectedElementId);
  const selectedElement = selectedElementIndex !== -1 ? timelineElements[selectedElementIndex] : null;
  
  const selectedElementLayer = selectedElement ? layers.find(l => l.id === selectedElement.layerId) : null;
  const isBackgroundElement = selectedElementLayer?.type === 'background';
  const backgroundElements = timelineElements.filter(el => layers.find(l => l.id === el.layerId)?.type === 'background');

  const handleFileUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedElement || !isBackgroundElement) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';
    try {
      const result = await uploadMedia(file);
      const newElements = [...timelineElements];
      newElements[selectedElementIndex] = { ...newElements[selectedElementIndex], type, content: result.url };
      setTimelineElements(newElements);
    } catch (err) {
      console.error('Background upload failed:', err);
    }
  };

  const isImageMode = outputFormat === 'image';

  return (
    <aside className="w-72 bg-neutral-900 border-l border-neutral-800/60 flex flex-col z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
      {/* Properties section */}
      <div className={isImageMode ? 'shrink-0 border-b border-neutral-800 overflow-y-auto max-h-[50%]' : 'flex-1 overflow-y-auto'}>
        {activeTool === 'transitions' ? (
          <TransitionsPanel designMD={designMD} />
        ) : (selectedElementIds && selectedElementIds.size >= 2) ? (
          <MultiSelectActions
            selectedIds={selectedElementIds}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            clearSelection={clearSelection || (() => {})}
          />
        ) : selectedElementId ? (
          <ElementPropertiesPanel
            designMD={designMD}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            timeUnit={timeUnit}
            activeLayerId={activeLayerId}
            outputFormat={outputFormat}
          />
        ) : activeLayerId && layers.find(l => l.id === activeLayerId)?.type === 'audio' ? (
          <AudioLayerPanel 
            activeLayerId={activeLayerId} 
            setTimelineElements={setTimelineElements} 
            timelineElements={timelineElements} 
            playerRef={playerRef} 
            endFrameLimit={timelineElements.find(el => layers.find(l => l.id === el.layerId)?.type === 'background')?.endFrame || 150} 
          />
        ) : activeLayerId && layers.find(l => l.id === activeLayerId)?.type === 'visual' ? (
          <GraphicLayerPanel />
        ) : (
          <GlobalSettingsPanel
            textOverlay={textOverlay}
            setTextOverlay={setTextOverlay}
            onExportClick={onExportClick}
            onShowRenderHistory={onShowRenderHistory}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            layers={layers}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showSafeZone={showSafeZone}
            setShowSafeZone={setShowSafeZone}
          />
        )}
      </div>

      {/* Layers panel — image mode only (replaces the hidden timeline) */}
      {isImageMode && (
        <div className="flex-1 min-h-0 border-t border-neutral-800">
          <ImageLayersPanel
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            layers={layers}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
          />
        </div>
      )}
    </aside>
  );
};
