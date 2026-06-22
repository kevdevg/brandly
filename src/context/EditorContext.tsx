import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, RefObject } from 'react';
import { PlayerRef } from '@remotion/player';
import { TimelineElement, TimelineLayer, DesignMD, BrandContentPiece } from '../types';
import { useHistory } from '../hooks/useHistory';
import { DEFAULT_DESIGN_MD } from '../data/defaults';
import type { CanvasActionMode } from '../components/composition/ElementActionToolbar';

interface EditorState {
  // Timeline
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  layers: TimelineLayer[];
  setLayers: React.Dispatch<React.SetStateAction<TimelineLayer[]>>;

  // Selection
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  selectedElementIds: Set<string>;
  toggleElementSelection: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  activeTool: 'select' | 'text' | 'sticker' | 'media' | 'transitions';
  setActiveTool: (tool: 'select' | 'text' | 'sticker' | 'media' | 'transitions') => void;

  // Canvas interaction mode (shared between toolbar and canvas)
  activeAction: CanvasActionMode;
  setActiveAction: (action: CanvasActionMode) => void;

  // Design
  designMD: DesignMD;
  setDesignMD: React.Dispatch<React.SetStateAction<DesignMD>>;
  textOverlay: string;
  setTextOverlay: (text: string) => void;

  // Player
  playerRef: RefObject<PlayerRef | null>;

  // Format
  outputFormat: 'video' | 'image';
  setOutputFormat: (format: 'video' | 'image') => void;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3') => void;

  // Timeline controls
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
  timeUnit: 'frames' | 'seconds';
  setTimeUnit: (unit: 'frames' | 'seconds') => void;
  durationInFrames: number;

  // Canvas zoom (shared between TopHeader and Workspace)
  canvasZoom: number;
  setCanvasZoom: React.Dispatch<React.SetStateAction<number>>;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Brand Content (read-only in studio, managed at App level)
  brandContent: BrandContentPiece[];

  // Brand visibility toggles
  brandVisibility: { logo: boolean; frame: boolean; background: boolean };
  setBrandVisibility: React.Dispatch<React.SetStateAction<{ logo: boolean; frame: boolean; background: boolean }>>;
}

const EditorContext = createContext<EditorState | null>(null);

export function useEditor(): EditorState {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

interface EditorProviderProps {
  children: ReactNode;
  initialDesignMD?: DesignMD;
  initialElements?: TimelineElement[];
  initialLayers?: TimelineLayer[];
  initialFormat?: 'video' | 'image';
  brandContent?: BrandContentPiece[];
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialDesignMD = DEFAULT_DESIGN_MD,
  initialElements = [],
  initialLayers = [{ id: 'layer-1', name: 'Capa Gráfica 1', type: 'visual' }],
  initialFormat = 'video',
  brandContent = [],
}) => {
  const [timelineElements, setTimelineElements] = useState<TimelineElement[]>(initialElements);
  const [layers, setLayers] = useState<TimelineLayer[]>(initialLayers);
  const [selectedElementId, _setSelectedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());

  // Keep selectedElementId synced with selectedElementIds
  const setSelectedElementId = useCallback((id: string | null) => {
    _setSelectedElementId(id);
    setSelectedElementIds(id ? new Set([id]) : new Set());
  }, []);

  const toggleElementSelection = useCallback((id: string, multi = false) => {
    if (multi) {
      setSelectedElementIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          // Update primary to last remaining or null
          const remaining = Array.from(next);
          _setSelectedElementId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
        } else {
          next.add(id);
          _setSelectedElementId(id);
        }
        return next;
      });
    } else {
      _setSelectedElementId(id);
      setSelectedElementIds(new Set([id]));
    }
  }, []);

  const clearSelection = useCallback(() => {
    _setSelectedElementId(null);
    setSelectedElementIds(new Set());
  }, []);
  const [activeLayerId, setActiveLayerId] = useState<string>(() => {
    const nonBrand = initialLayers.find(l => l.type !== 'brand');
    return nonBrand?.id || initialLayers[0]?.id || 'layer-1';
  });
  const [activeTool, setActiveTool] = useState<EditorState['activeTool']>('select');
  const [activeAction, setActiveAction] = useState<CanvasActionMode>('move');
  const [designMD, setDesignMD] = useState<DesignMD>(initialDesignMD);
  const [textOverlay, setTextOverlay] = useState('');
  const [outputFormat, setOutputFormat] = useState<'video' | 'image'>(initialFormat);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5' | '4:3'>('9:16');
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [timeUnit, setTimeUnit] = useState<'frames' | 'seconds'>('frames');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [brandVisibility, setBrandVisibility] = useState<{ logo: boolean; frame: boolean; background: boolean }>({ logo: true, frame: true, background: true });
  const playerRef = useRef<PlayerRef>(null);

  const durationInFrames = timelineElements.reduce((max, el) => Math.max(max, el.endFrame), 300);

  const { undo, redo, canUndo, canRedo } = useHistory(
    timelineElements, layers, setTimelineElements, setLayers
  );

  const value: EditorState = {
    timelineElements, setTimelineElements,
    layers, setLayers,
    selectedElementId, setSelectedElementId,
    selectedElementIds, toggleElementSelection, clearSelection,
    activeLayerId, setActiveLayerId,
    activeTool, setActiveTool,
    activeAction, setActiveAction,
    designMD, setDesignMD,
    textOverlay, setTextOverlay,
    playerRef,
    outputFormat, setOutputFormat,
    aspectRatio, setAspectRatio,
    timelineZoom, setTimelineZoom,
    timeUnit, setTimeUnit,
    durationInFrames,
    canvasZoom, setCanvasZoom,
    undo, redo, canUndo, canRedo,
    brandContent,
    brandVisibility, setBrandVisibility,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
