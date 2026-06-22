import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ExportModal } from '../export/ExportModal';
import { StudioToolbar, PanelType } from '../StudioToolbar';
import { StudioWorkspace } from '../StudioWorkspace';
import { CanvasZoomControls } from '../ui/CanvasZoomControls';
import { PlaybackInfo } from '../ui/PlaybackInfo';
import { StudioProperties } from '../StudioProperties';
import { StudioTimeline } from '../StudioTimeline';
import { MediaLibraryPanel } from '../MediaLibraryPanel';
import { TextPanel } from '../panels/TextPanel';
import { StickersPanel } from '../panels/StickersPanel';
import { AudioPanel } from '../panels/AudioPanel';
import { ShapesPanel } from '../panels/ShapesPanel';
import { SoundEffectsPanel } from '../panels/SoundEffectsPanel';
import { ShortcutsOverlay } from '../ui/ShortcutsOverlay';
import { RenderHistoryPanel } from '../ui/RenderHistoryPanel';
import { ElementSearch } from '../ui/ElementSearch';
import { TimelineMarkerList, TimelineMarker } from '../timeline/TimelineMarkerList';
import { ResponsivePreviewToggle } from '../ui/ResponsivePreviewToggle';
import { AutoSaveIndicator } from '../ui/AutoSaveIndicator';
import { CanvasGridOverlay } from '../ui/CanvasGridOverlay';

import { useEditor } from '../../context/EditorContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useCanvasShortcuts } from '../../hooks/useCanvasShortcuts';
import { RenderProps, TimelineElement } from '../../types';

/**
 * StudioEditor: The main editing view.
 * Reads all state from EditorContext — no prop drilling needed.
 */
export const StudioEditor: React.FC = () => {
  const {
    timelineElements, setTimelineElements,
    layers, setLayers,
    selectedElementId, setSelectedElementId,
    activeLayerId, setActiveLayerId,
    activeTool, setActiveTool,
    designMD,
    textOverlay, setTextOverlay,
    playerRef,
    outputFormat,
    aspectRatio, setAspectRatio,
    timelineZoom, setTimelineZoom,
    timeUnit, setTimeUnit,
    durationInFrames,
    canvasZoom, setCanvasZoom,
    undo, redo,
    brandContent,
    brandVisibility, setBrandVisibility,
    activeAction, setActiveAction,
    selectedElementIds, toggleElementSelection, clearSelection,
  } = useEditor();

  // Panel state (replaces old activeTool for toolbar)
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRenderHistory, setShowRenderHistory] = useState(false);
  const [showElementSearch, setShowElementSearch] = useState(false);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'phone' | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);

  // ═══ Auto-save to localStorage ═══
  const AUTOSAVE_KEY = 'studio-autosave';
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Auto-save after 2s of inactivity
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        const data = {
          timelineElements: timelineElements.filter(e => !e.isBrandElement),
          aspectRatio,
          markers,
          savedAt: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
        setLastSaved(Date.now());
      } catch { /* quota exceeded — silently fail */ }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [timelineElements, aspectRatio, markers]);

  // Auto-load on mount (only if no elements exist)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.timelineElements?.length && timelineElements.filter(e => !e.isBrandElement).length === 0) {
        setTimelineElements(prev => {
          const brand = prev.filter(e => e.isBrandElement);
          return [...brand, ...data.timelineElements];
        });
        if (data.markers) setMarkers(data.markers);
      }
    } catch { /* corrupted data — ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas zoom keyboard shortcuts (Cmd+=/Cmd+-/Cmd+0)
  useCanvasShortcuts(setCanvasZoom);

  // ? key toggles shortcuts overlay, Cmd+F toggles element search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowElementSearch(prev => !prev);
      }
      // G = toggle grid, Shift+S = toggle safe zone
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        setShowGrid(prev => !prev);
      }
      if (e.key === 'S' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setShowSafeZone(prev => !prev);
      }
      // Escape clears selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    playerRef,
    durationInFrames,
    selectedElementId,
    setSelectedElementId,
    timelineElements,
    setTimelineElements,
    undo,
    redo,
  });

  // --- Memoized callbacks for composition ---
  const handleElementClick = useCallback((id: string) => {
    setSelectedElementId(id);
    const element = timelineElements.find(el => el.id === id);
    // In image mode, auto-switch active layer to the element's layer
    if (element && outputFormat === 'image') {
      setActiveLayerId(element.layerId);
    }
    if (element && playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame();
      if (currentFrame < element.startFrame || currentFrame >= element.endFrame) {
        playerRef.current.seekTo(element.startFrame);
      }
    }
  }, [timelineElements, playerRef, setSelectedElementId, outputFormat, setActiveLayerId]);

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setTimelineElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  }, [setTimelineElements]);

  const handleTransformChange = useCallback((id: string, updates: Partial<TimelineElement>) => {
    setTimelineElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, [setTimelineElements]);

  const handleDuplicate = useCallback((id: string) => {
    setTimelineElements(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      const copy: TimelineElement = {
        ...el,
        id: 'el-' + Date.now(),
        x: el.x + 3,
        y: el.y + 3,
        isBrandElement: false,
        isLocked: false,
      };
      const idx = prev.findIndex(e => e.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, [setTimelineElements]);

  const handleDelete = useCallback((id: string) => {
    setTimelineElements(prev => {
      const el = prev.find(e => e.id === id);
      if (el?.isBrandElement) return prev;
      return prev.filter(e => e.id !== id);
    });
    setSelectedElementId(null);
  }, [setTimelineElements, setSelectedElementId]);

  const handleLock = useCallback((id: string) => {
    setTimelineElements(prev => prev.map(el =>
      el.id === id ? { ...el, isLocked: !el.isLocked } : el
    ));
  }, [setTimelineElements]);

  // --- Composition Props (memoized) ---
  const compositionProps: RenderProps = useMemo(() => ({
    designMD,
    textOverlay,
    layers,
    timelineElements: timelineElements
      .filter(el => {
        const layer = layers.find(l => l.id === el.layerId);
        return layer ? layer.isVisible !== false : true;
      })
      .sort((a, b) => {
        const aIsActive = a.layerId === activeLayerId ? 1 : 0;
        const bIsActive = b.layerId === activeLayerId ? 1 : 0;
        if (aIsActive !== bIsActive) return aIsActive - bIsActive;
        const indexA = layers.findIndex(l => l.id === a.layerId);
        const indexB = layers.findIndex(l => l.id === b.layerId);
        return indexB - indexA;
      }),
    selectedElementId,
    activeLayerId,
    onElementClick: handleElementClick,
    onElementPositionChange: handlePositionChange,
    onElementTransformChange: handleTransformChange,
    onElementDuplicate: handleDuplicate,
    onElementDelete: handleDelete,
    onElementLock: handleLock,
    activeAction,
    brandVisibility,
    outputFormat,
  }), [designMD, textOverlay, layers, timelineElements, selectedElementId, activeLayerId, activeAction, brandVisibility, outputFormat, handleElementClick, handlePositionChange, handleTransformChange, handleDuplicate, handleDelete, handleLock]);

  return (
    <>
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        
        <StudioToolbar 
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          onShowShortcuts={() => setShowShortcuts(true)}
          outputFormat={outputFormat}
        />

        {/* Sliding Panels */}
        {activePanel === 'media' && (
          <MediaLibraryPanel 
            onClose={() => setActivePanel(null)} 
            designMD={designMD} 
            brandContent={brandContent}
          />
        )}
        {activePanel === 'text' && (
          <TextPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'stickers' && (
          <StickersPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'shapes' && (
          <ShapesPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'audio' && (
          <AudioPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'sfx' && (
          <SoundEffectsPanel onClose={() => setActivePanel(null)} />
        )}

        <div className="relative flex-1 flex flex-col min-h-0">
          <StudioWorkspace 
            activeTool={activeTool}
            setSelectedElementId={setSelectedElementId}
            selectedElementId={selectedElementId}
            playerRef={playerRef}
            compositionProps={compositionProps}
            durationInFrames={durationInFrames}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            outputFormat={outputFormat}
            activeLayerId={activeLayerId}
            zoom={canvasZoom}
            setZoom={setCanvasZoom}
          />
          <CanvasZoomControls
            zoom={canvasZoom}
            onZoomIn={() => setCanvasZoom(prev => Math.min(5, prev + 0.25))}
            onZoomOut={() => setCanvasZoom(prev => Math.max(0.1, prev - 0.25))}
            onZoomReset={() => setCanvasZoom(1)}
            onFitToScreen={() => setCanvasZoom(1)}
            onUndo={undo}
            onRedo={redo}
            onSetZoom={setCanvasZoom}
          />
          <PlaybackInfo
            playerRef={playerRef}
            durationInFrames={durationInFrames}
            elementCount={timelineElements.length}
          />
          {/* Responsive Preview Toggle + Grid/SafeZone toggles */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
            <ResponsivePreviewToggle mode={previewMode} onModeChange={setPreviewMode} />
            <div className="flex items-center gap-0.5 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/40 rounded-lg p-0.5">
              <button
                onClick={() => setShowGrid(!showGrid)}
                title={showGrid ? 'Ocultar grilla' : 'Mostrar grilla (regla de tercios)'}
                className={`p-1 rounded-md transition-all text-[10px] ${
                  showGrid ? 'bg-violet-500/20 text-violet-300' : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                ▦
              </button>
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                title={showSafeZone ? 'Ocultar zona segura' : 'Mostrar zona segura (broadcast)'}
                className={`p-1 rounded-md transition-all text-[10px] ${
                  showSafeZone ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                ◻
              </button>
            </div>
          </div>
          {/* Canvas Grid + Safe Zone Overlay */}
          <CanvasGridOverlay showGrid={showGrid} showSafeZone={showSafeZone} width={1080} height={1080} />
          {/* Auto-save indicator */}
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>

        <StudioProperties 
          designMD={designMD}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
          timelineElements={timelineElements}
          setTimelineElements={setTimelineElements}
          layers={layers}
          activeLayerId={activeLayerId}
          timeUnit={timeUnit}
          textOverlay={textOverlay}
          setTextOverlay={setTextOverlay}
          playerRef={playerRef}
          activeTool={activeTool}
          outputFormat={outputFormat}
          onExportClick={() => setShowExportModal(true)}
          onShowRenderHistory={() => setShowRenderHistory(true)}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showSafeZone={showSafeZone}
          setShowSafeZone={setShowSafeZone}
          selectedElementIds={selectedElementIds}
          clearSelection={clearSelection}
        />
      </div>

      {outputFormat !== 'image' && (
        <div className="flex flex-col">
          <StudioTimeline 
            timelineZoom={timelineZoom}
            setTimelineZoom={setTimelineZoom}
            timeUnit={timeUnit}
            setTimeUnit={setTimeUnit}
            durationInFrames={durationInFrames}
            timelineElements={timelineElements}
            setTimelineElements={setTimelineElements}
            layers={layers}
            setLayers={setLayers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            playerRef={playerRef}
            activeTool={activeTool}
            outputFormat={outputFormat}
            designMD={designMD}
            selectedElementIds={selectedElementIds}
            toggleElementSelection={toggleElementSelection}
          />
          <TimelineMarkerList
            markers={markers}
            setMarkers={setMarkers}
            currentFrame={playerRef.current?.getCurrentFrame?.() ?? 0}
            durationInFrames={durationInFrames}
            fps={30}
            onSeekToFrame={(frame) => playerRef.current?.seekTo(frame)}
          />
        </div>
      )}

    </div>

    {/* Export Modal */}
    <ExportModal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      designMD={designMD}
      textOverlay={textOverlay}
      timelineElements={timelineElements}
      layers={layers}
      durationInFrames={durationInFrames}
      brandVisibility={brandVisibility}
      outputFormat={outputFormat}
    />

    {/* Shortcuts Overlay */}
    <ShortcutsOverlay
      isOpen={showShortcuts}
      onClose={() => setShowShortcuts(false)}
    />

    {/* Render History */}
    <RenderHistoryPanel
      isOpen={showRenderHistory}
      onClose={() => setShowRenderHistory(false)}
    />

    {/* Element Search (Cmd+F toggle) */}
    {showElementSearch && (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-white">🔍 Buscar Elementos</span>
          <button onClick={() => setShowElementSearch(false)} title="Cerrar" className="text-neutral-500 hover:text-white text-xs">✕</button>
        </div>
        <ElementSearch
          timelineElements={timelineElements}
          selectedElementId={selectedElementId}
          onSelectElement={(id) => { setSelectedElementId(id); setShowElementSearch(false); }}
        />
      </div>
    )}
    </>
  );
};
