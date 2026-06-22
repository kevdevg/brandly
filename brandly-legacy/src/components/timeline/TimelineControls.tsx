import React, { useState } from 'react';
import { Clock, Scissors, ZoomIn, ZoomOut, LayoutTemplate } from 'lucide-react';
import { SCENE_TEMPLATES, SceneTemplate } from '../../config/sceneTemplates';

interface TimelineControlsProps {
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
  timeUnit: 'frames' | 'seconds';
  setTimeUnit: (unit: 'frames' | 'seconds') => void;
  durationInFrames: number;
  selectedElementId: string | null;
  onSplit: () => void;
  outputFormat?: 'video' | 'image';
  onInsertTemplate?: (template: SceneTemplate) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  timelineZoom,
  setTimelineZoom,
  timeUnit,
  setTimeUnit,
  durationInFrames,
  selectedElementId,
  onSplit,
  outputFormat,
  onInsertTemplate
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const categories = [
    { key: 'titulo' as const, label: 'Títulos' },
    { key: 'contenido' as const, label: 'Contenido' },
    { key: 'cierre' as const, label: 'Cierres' },
    { key: 'transicion' as const, label: 'Transiciones' },
  ];
  return (
    <div className="border-b border-neutral-800 p-2 flex items-center justify-between bg-neutral-950/50">
      <div className="flex items-center gap-2 px-2">
        <Clock size={14} className="text-violet-400" />
        <span className="text-xs font-bold text-white tracking-wide">TIMELINE</span>
      </div>
      
      {/* Timeline Controls */}
      {outputFormat !== 'image' && (
      <div className="flex items-center gap-4 pr-2">
        <button 
          onClick={onSplit}
          title="Cortar en cabezal"
          disabled={!selectedElementId}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 transition-colors text-xs font-medium ${selectedElementId ? 'hover:bg-neutral-800 text-neutral-300' : 'text-neutral-600 cursor-not-allowed'}`}
        >
          <Scissors size={14} /> Cortar
        </button>

        {/* Scene Templates */}
        {onInsertTemplate && (
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              title="Insertar plantilla de escena"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-300"
            >
              <LayoutTemplate size={14} /> Plantillas
            </button>
            {showTemplates && (
              <div className="absolute left-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-50 min-w-[220px] max-h-80 overflow-y-auto custom-scrollbar">
                {categories.map(cat => {
                  const templates = SCENE_TEMPLATES.filter(t => t.category === cat.key);
                  if (templates.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      <div className="px-3 py-1 text-[9px] text-neutral-500 uppercase tracking-wider font-semibold bg-neutral-950/50 sticky top-0">
                        {cat.label}
                      </div>
                      {templates.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => { onInsertTemplate(tpl); setShowTemplates(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors text-left"
                          title={tpl.description}
                        >
                          <span className="text-sm">{tpl.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{tpl.name}</div>
                            <div className="text-[9px] text-neutral-500">{tpl.description}</div>
                          </div>
                          <span className="text-[9px] text-neutral-600 font-mono">{(tpl.durationFrames / 30).toFixed(1)}s</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
          <button 
            onClick={() => setTimelineZoom(Math.max(1, timelineZoom - 0.5))}
            title="Alejar (Zoom Out)"
            className="text-neutral-400 hover:text-white p-0.5 transition-colors rounded hover:bg-neutral-700"
          >
            <ZoomOut size={12} />
          </button>
          <span className="text-[10px] text-neutral-300 font-mono w-6 text-center" title="Nivel de Zoom">{timelineZoom}x</span>
          <button 
            onClick={() => setTimelineZoom(Math.min(5, timelineZoom + 0.5))}
            title="Acercar (Zoom In)"
            className="text-neutral-400 hover:text-white p-0.5 transition-colors rounded hover:bg-neutral-700"
          >
            <ZoomIn size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as 'frames' | 'seconds')}
            title="Unidad de Tiempo"
            className="bg-neutral-900 text-[10px] text-neutral-400 border border-neutral-800 rounded outline-none p-1"
          >
            <option value="frames">Frames</option>
            <option value="seconds">Segundos</option>
          </select>
          <div className="w-16 bg-neutral-900 text-[10px] rounded border border-neutral-800 px-1 py-1 text-center font-mono text-neutral-500" title={`${durationInFrames}f @ 30fps`}>
            {timeUnit === 'frames' ? durationInFrames : (durationInFrames / 30).toFixed(2)} {timeUnit === 'frames' ? 'f' : 's'}
          </div>
          <div className="text-[9px] text-neutral-600 font-mono" title="Duración total">
            {Math.floor(durationInFrames / 30 / 60)}:{String(Math.floor((durationInFrames / 30) % 60)).padStart(2, '0')}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
