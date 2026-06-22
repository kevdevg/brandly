import React, { useCallback, RefObject } from 'react';
import { Film, Play, Camera, Download, Grid3x3, Palette, Maximize } from 'lucide-react';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { PlayerRef } from '@remotion/player';
import { EXPORT_PRESETS } from '../../config/constants';
import { TimelineElement, TimelineLayer } from '../../types';
import { ProjectStats } from '../ui/ProjectStats';
import { QuickElementTemplates } from '../ui/QuickElementTemplates';
import { BulkActionsBar } from '../ui/BulkActionsBar';

interface GlobalSettingsPanelProps {
  textOverlay: string;
  setTextOverlay: (text: string) => void;
  playerRef?: RefObject<PlayerRef | null>;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5' | '4:3';
  outputFormat?: 'video' | 'image';
  onExportClick?: () => void;
  timelineElements?: TimelineElement[];
  setTimelineElements?: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  showGrid?: boolean;
  setShowGrid?: (show: boolean) => void;
  showSafeZone?: boolean;
  setShowSafeZone?: (show: boolean) => void;
  onShowRenderHistory?: () => void;
  layers?: TimelineLayer[];
  durationInFrames?: number;
  fps?: number;
}

export const GlobalSettingsPanel: React.FC<GlobalSettingsPanelProps> = ({
  textOverlay, setTextOverlay, playerRef, aspectRatio, outputFormat, onExportClick,
  timelineElements, setTimelineElements, showGrid, setShowGrid, showSafeZone, setShowSafeZone,
  onShowRenderHistory, layers, durationInFrames, fps,
}) => {
  // ═══ Export frame as PNG ═══
  const handleExportFrame = useCallback(() => {
    const player = playerRef?.current;
    if (!player) return;
    
    // Find the remotion-player container and grab its inner canvas/iframe
    const playerContainer = document.querySelector('[data-remotion-player]') ?? document.querySelector('.remotion-player');
    if (!playerContainer) {
      // Fallback: find the iframe or video element
      const iframe = document.querySelector('iframe');
      if (iframe) {
        // Can't capture cross-origin iframe, but for same-origin:
        try {
          const iframeDoc = iframe.contentDocument;
          if (iframeDoc) {
            const canvas = document.createElement('canvas');
            const body = iframeDoc.body;
            canvas.width = body.scrollWidth;
            canvas.height = body.scrollHeight;
            // This is a simplistic approach - Remotion doesn't expose easy screenshot
          }
        } catch { /* cross-origin */ }
      }
    }
    
    // Use html2canvas-like approach: create a temporary canvas from the player
    // For now, use a simple screenshot via the Remotion player's renderToCanvas
    alert('📸 Exportar frame: Esta función requiere @remotion/renderer para renderizar frames individuales. Próximamente disponible.');
  }, [playerRef]);

  const matchingPresets = EXPORT_PRESETS.filter(p => p.aspect === aspectRatio);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-neutral-800">
        <h2 className="text-sm font-bold text-white mb-1"><Film size={16} className="inline mr-2 text-violet-400 align-text-bottom"/> Configuración Global</h2>
        <p className="text-[11px] text-neutral-400">Parámetros base del render.</p>
      </div>

      <div className="p-5 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Text Overlay */}
        {/* Project Stats */}
        {timelineElements && layers && durationInFrames && (
          <div className="bg-neutral-950/30 border border-neutral-800/30 rounded-lg p-2.5">
            <ProjectStats
              timelineElements={timelineElements}
              layers={layers}
              durationInFrames={durationInFrames}
              fps={fps ?? 30}
            />
          </div>
        )}

        {/* ── Herramientas Avanzadas (collapsible) ── */}
        <CollapsibleSection title="Herramientas">
          {/* Quick Templates */}
          {setTimelineElements && (
            <div className="bg-neutral-950/30 border border-neutral-800/30 rounded-lg p-2.5">
              <QuickElementTemplates
                onAddElement={(partial) => {
                  const newEl: TimelineElement = {
                    id: 'el-' + Date.now(),
                    type: partial.type || 'text',
                    content: partial.content || '',
                    startFrame: 0,
                    endFrame: 150,
                    layerId: 'default',
                    ...partial,
                  } as TimelineElement;
                  setTimelineElements(prev => [...prev, newEl]);
                }}
              />
            </div>
          )}

          {/* Bulk Actions */}
          {timelineElements && setTimelineElements && (
            <div className="bg-neutral-950/30 border border-neutral-800/30 rounded-lg p-2.5">
              <BulkActionsBar
                timelineElements={timelineElements}
                setTimelineElements={setTimelineElements}
                setSelectedElementId={() => {}}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">Pie de Mensaje Fijo</label>
            <textarea
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              rows={2}
              placeholder="Mensaje inferior..."
              className="bg-neutral-950 text-sm rounded-lg px-3 py-2 w-full border border-neutral-800 outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Opciones de Fondo">
          {/* Background Pattern Presets */}
          {timelineElements && setTimelineElements && (
            <div>
              <span className="text-[9px] text-neutral-500 block mb-1">Patrones</span>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { name: 'Ninguno', bg: 'none', preview: '⊘' },
                  { name: 'Puntos', bg: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', preview: '⋯' },
                  { name: 'Líneas', bg: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 12px)', preview: '╱' },
                  { name: 'Cuadrícula', bg: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 20px)', preview: '⊞' },
                  { name: 'Damero', bg: 'repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px', preview: '⊟' },
                ].map(pattern => (
                  <button
                    key={pattern.name}
                    onClick={() => {
                      if (!setTimelineElements) return;
                      setTimelineElements(prev => prev.map(el => {
                        if (el.type !== 'color') return el;
                        return { ...el, backgroundPattern: pattern.bg === 'none' ? undefined : pattern.bg };
                      }));
                    }}
                    title={pattern.name}
                    className="py-1 rounded text-[9px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-violet-300 hover:border-violet-500/30 transition-all"
                  >
                    {pattern.preview}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background Image Upload */}
          {setTimelineElements && (
            <div>
              <span className="text-[9px] text-neutral-500 block mb-1">Imagen de fondo</span>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-neutral-700 hover:border-violet-500 cursor-pointer transition-colors text-[10px] text-neutral-400 hover:text-violet-300">
                <Camera size={12} />
                Subir imagen de fondo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !setTimelineElements) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      if (data.url) {
                        const bgEl: TimelineElement = {
                          id: crypto.randomUUID(),
                          layerId: 'background',
                          type: 'sticker',
                          content: data.url,
                          startFrame: 0,
                          endFrame: 9999,
                          x: 50, y: 50,
                          width: 100,
                          objectFit: 'cover',
                        };
                        setTimelineElements(prev => [bgEl, ...prev]);
                      }
                    } catch (err) {
                      console.error('Upload failed:', err);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Vista">
          {/* Grid Toggle */}
          {setShowGrid && (
            <div className="flex items-center justify-between py-1">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Grid3x3 size={12} className="text-neutral-500" />
                Cuadrícula
              </label>
              <button
                onClick={() => setShowGrid(!showGrid)}
                title={showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all border ${
                  showGrid
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {showGrid ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Safe Zone Toggle */}
          {setShowSafeZone && (
            <div className="flex items-center justify-between py-1">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Maximize size={12} className="text-neutral-500" />
                Zona Segura
              </label>
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                title={showSafeZone ? "Ocultar zona segura" : "Mostrar zona segura"}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all border ${
                  showSafeZone
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {showSafeZone ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Project Stats */}
      {timelineElements && (
        <div className="px-5 py-3 border-t border-neutral-800/40">
          <span className="text-[9px] font-medium text-neutral-500 uppercase tracking-wider block mb-2">Estadísticas</span>
          <div className="grid grid-cols-5 gap-1">
            {[
              { type: 'text', icon: '📝', color: '#a78bfa' },
              { type: 'image', icon: '🖼️', color: '#34d399' },
              { type: 'video', icon: '🎬', color: '#f472b6' },
              { type: 'audio', icon: '🎵', color: '#38bdf8' },
              { type: 'sticker', icon: '⭐', color: '#fbbf24' },
            ].map(item => {
              const count = timelineElements.filter(e => e.type === item.type && !e.isBrandElement).length;
              return (
                <div key={item.type} className="flex flex-col items-center gap-0.5 py-1 rounded bg-neutral-900/50">
                  <span className="text-xs">{item.icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: item.color }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono mt-1">
            <span>Total: {timelineElements.filter(e => !e.isBrandElement).length} elementos</span>
            <span>{aspectRatio ?? '9:16'}</span>
          </div>
        </div>
      )}

      <div className="p-5 border-t border-neutral-800 shrink-0 space-y-2">
        {/* Capture frame button */}
        <button
          title="Exportar Frame como PNG"
          onClick={onExportClick}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs border border-neutral-700"
        >
          <Camera size={14} /> Capturar Frame
        </button>
        {/* Render button */}
        <button
          title="Exportar Video"
          onClick={onExportClick}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-xl shadow-violet-900/20"
        >
          <Play size={16} fill="currentColor" /> Renderizar
        </button>
        {/* Project Save/Load */}
        <div className="flex gap-1.5 mt-1">
          <button
            title="Guardar proyecto como JSON"
            onClick={() => {
              const data = JSON.stringify({
                version: 1,
                aspectRatio,
                timelineElements: timelineElements.filter(e => !e.isBrandElement),
                exportedAt: new Date().toISOString(),
              }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `project-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] border border-neutral-700"
          >
            💾 Guardar
          </button>
          <button
            title="Cargar proyecto desde JSON"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  if (data.timelineElements && Array.isArray(data.timelineElements)) {
                    setTimelineElements(prev => {
                      const brandElements = prev.filter(el => el.isBrandElement);
                      return [...brandElements, ...data.timelineElements];
                    });
                  }
                } catch { /* silently fail */ }
              };
              input.click();
            }}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] border border-neutral-700"
          >
            📂 Cargar
          </button>
        </div>
        {/* Render History */}
        {onShowRenderHistory && (
          <button
            onClick={onShowRenderHistory}
            title="Ver historial de renders"
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] border border-neutral-700 mt-1"
          >
            📋 Historial de Renders
          </button>
        )}
      </div>
    </div>
  );
};
