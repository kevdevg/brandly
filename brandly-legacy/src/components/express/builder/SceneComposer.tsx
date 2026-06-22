import React from 'react';
import { Film, Plus, X, ArrowRight, Volume2, Music, Camera } from 'lucide-react';
import { ExpressScene, DesignMD, CompanyProfile } from '../../../types';
import { SegmentCard } from './SegmentCard';

interface SceneComposerProps {
  scenes: ExpressScene[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onRemoveScene: (sceneId: string) => void;
  designMD: DesignMD;
  usesBrandAudio: boolean;
  format: 'video' | 'image';
  // Segment management
  onAddSegment: (position: 'before' | 'after', source: 'brand' | 'form') => void;
  onRemoveSegment: (position: 'before' | 'after') => void;
  onUpdateSegment: (sceneId: string, updates: Partial<ExpressScene>) => void;
  previewBrand: CompanyProfile | null;
}

/** Color mapping for scene types */
const TYPE_COLORS: Record<string, string> = {
  intro: '#10b981',
  content: '#8b5cf6',
  outro: '#f43f5e',
  transition: '#3b82f6',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  intro: <Film size={12} />,
  content: <Camera size={12} />,
  outro: <Film size={12} />,
  transition: <ArrowRight size={12} />,
};

/**
 * SceneComposer — Visual block composition for video templates.
 *
 * Layout: [Intro segment?] → [Content scene blocks + Add] → [Outro segment?]
 * Below track: [+ Antes] button (if no intro) | [+ Después] button (if no outro)
 */
export const SceneComposer: React.FC<SceneComposerProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRemoveScene,
  designMD,
  usesBrandAudio,
  format,
  onAddSegment,
  onRemoveSegment,
  onUpdateSegment,
  previewBrand,
}) => {
  // Separate segments from content scenes
  const introScene = scenes.find(s => s.type === 'intro') || null;
  const outroScene = scenes.find(s => s.type === 'outro') || null;
  const contentScenes = scenes.filter(s => s.type === 'content' || s.type === 'transition');

  const totalDur = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const contentDur = contentScenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const hasAudio = usesBrandAudio && !!designMD.brandAudioUrl;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-neutral-500" />
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Composición de Escenas
          </h4>
        </div>
        <span className="text-[10px] font-mono text-neutral-600">
          {totalDur.toFixed(1)}s · {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Video Track */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-0.5 text-[8px] text-neutral-500 mb-1.5 font-mono uppercase tracking-widest">
          <Film size={9} /> {format === 'video' ? 'Video' : 'Imagen'}
        </div>
        <div className="flex items-stretch gap-2 min-h-[48px]">
          {/* ── Intro Segment ── */}
          {introScene && (
            <>
              <div
                onClick={() => onSelectScene(introScene.id)}
                className={`cursor-pointer rounded-xl transition-all ${activeSceneId === introScene.id ? 'ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-neutral-950' : 'hover:ring-1 hover:ring-neutral-600/50'}`}
              >
                <SegmentCard
                  scene={introScene}
                  position="before"
                  designMD={designMD}
                  previewBrand={previewBrand}
                  onSourceChange={(source) => onUpdateSegment(introScene.id, {
                    segmentSource: source,
                    name: source === 'brand' ? 'Intro de marca' : 'Video de intro',
                    segmentFieldLabel: source === 'form' ? 'Video de intro' : undefined,
                    segmentFieldRequired: source === 'form' ? true : undefined,
                  })}
                  onDurationChange={(seconds) => onUpdateSegment(introScene.id, { durationSeconds: seconds })}
                  onLabelChange={(label) => onUpdateSegment(introScene.id, { segmentFieldLabel: label })}
                  onRequiredChange={(required) => onUpdateSegment(introScene.id, { segmentFieldRequired: required })}
                  onTransitionChange={(type) => onUpdateSegment(introScene.id, {
                    segmentTransition: { type, duration: introScene.segmentTransition?.duration || 10 },
                  })}
                  onRemove={() => onRemoveSegment('before')}
                />
              </div>
              {/* Arrow between intro and content */}
              <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                <div className="w-5 h-5 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center">
                  <ArrowRight size={8} className="text-neutral-400" />
                </div>
              </div>
            </>
          )}

          {/* ── Content block: fixed "Contenido" badge ── */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {contentScenes.map((scene, i) => {
              const color = TYPE_COLORS[scene.type] || TYPE_COLORS.content;
              const isActive = activeSceneId === scene.id;
              const widthPct = contentDur > 0 ? (scene.durationSeconds / contentDur) * 100 : 25;
              const canRemove = contentScenes.length > 1;

              return (
                <React.Fragment key={scene.id}>
                  <button
                    onClick={() => onSelectScene(scene.id)}
                    title={`${scene.name} — ${scene.durationSeconds}s · Click para editar`}
                    className={`h-12 rounded-lg flex flex-col items-center justify-center text-center transition-all relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-offset-1 ring-offset-neutral-900 scale-[1.02] z-10'
                        : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      flex: `${Math.max(widthPct, 12)} 0 0`,
                      minWidth: '80px',
                      backgroundColor: isActive ? `${color}30` : `${color}15`,
                      border: `1px solid ${isActive ? color : `${color}40`}`,
                      ['--tw-ring-color' as string]: color,
                    }}
                  >
                    {/* Shimmer on active */}
                    {isActive && (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                    )}

                    <span style={{ color }} className="mb-0.5 opacity-80 relative z-10">
                      {TYPE_ICONS[scene.type]}
                    </span>
                    <span className="text-[8px] font-bold tracking-wider text-white/80 relative z-10">
                      {scene.name.toUpperCase()}
                    </span>
                    {format === 'video' && (
                      <span className="text-[8px] font-mono text-neutral-400 relative z-10">
                        {scene.durationSeconds}s
                      </span>
                    )}

                    {/* Remove button */}
                    {canRemove && isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveScene(scene.id); }}
                        title="Eliminar escena"
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-red-400 transition-colors z-20"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </button>

                  {/* Transition dot between content scenes */}
                  {i < contentScenes.length - 1 && (
                    <div className="flex flex-col items-center shrink-0 px-0.5 gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center">
                        <ArrowRight size={8} className="text-neutral-400" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Add content scene button */}
            <button
              onClick={onAddScene}
              title="Agregar escena de contenido"
              className="h-12 min-w-[40px] rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* ── Outro Segment ── */}
          {outroScene && (
            <>
              {/* Arrow between content and outro */}
              <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                <div className="w-5 h-5 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center">
                  <ArrowRight size={8} className="text-neutral-400" />
                </div>
              </div>
              <div
                onClick={() => onSelectScene(outroScene.id)}
                className={`cursor-pointer rounded-xl transition-all ${activeSceneId === outroScene.id ? 'ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-neutral-950' : 'hover:ring-1 hover:ring-neutral-600/50'}`}
              >
                <SegmentCard
                  scene={outroScene}
                  position="after"
                  designMD={designMD}
                  previewBrand={previewBrand}
                  onSourceChange={(source) => onUpdateSegment(outroScene.id, {
                    segmentSource: source,
                    name: source === 'brand' ? 'Outro de marca' : 'Video de cierre',
                    segmentFieldLabel: source === 'form' ? 'Video de cierre' : undefined,
                    segmentFieldRequired: source === 'form' ? true : undefined,
                  })}
                  onDurationChange={(seconds) => onUpdateSegment(outroScene.id, { durationSeconds: seconds })}
                  onLabelChange={(label) => onUpdateSegment(outroScene.id, { segmentFieldLabel: label })}
                  onRequiredChange={(required) => onUpdateSegment(outroScene.id, { segmentFieldRequired: required })}
                  onTransitionChange={(type) => onUpdateSegment(outroScene.id, {
                    segmentTransition: { type, duration: outroScene.segmentTransition?.duration || 10 },
                  })}
                  onRemove={() => onRemoveSegment('after')}
                />
              </div>
            </>
          )}
        </div>

        {/* ── Add segment buttons (below track) ── */}
        {format === 'video' && (!introScene || !outroScene) && (
          <div className="flex items-center gap-2 mt-2">
            {!introScene && (
              <button
                onClick={() => onAddSegment('before', 'brand')}
                title="Agregar contenido antes (intro)"
                className="flex-1 h-8 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center gap-1.5 text-neutral-500 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all cursor-pointer text-[9px] font-medium"
              >
                <Plus size={10} /> Antes
              </button>
            )}
            {!outroScene && (
              <button
                onClick={() => onAddSegment('after', 'brand')}
                title="Agregar contenido después (outro)"
                className="flex-1 h-8 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center gap-1.5 text-neutral-500 hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer text-[9px] font-medium"
              >
                <Plus size={10} /> Después
              </button>
            )}
          </div>
        )}
      </div>

      {/* Audio Track (only for video) */}
      {format === 'video' && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-0.5 text-[8px] text-neutral-500 mb-1.5 font-mono uppercase tracking-widest">
            <Volume2 size={9} /> Audio
          </div>
          <div
            className={`w-full h-7 rounded-lg border flex items-center gap-2 px-3 ${
              hasAudio
                ? 'border-neutral-800 bg-neutral-950'
                : 'border-neutral-800 bg-transparent'
            }`}
          >
            {hasAudio ? (
              <>
                <div className="flex items-end gap-[1px] h-4 flex-1">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-neutral-600"
                      style={{
                        height: `${Math.max(2, Math.sin(i * 0.4) * 10 + Math.random() * 5 + 3)}px`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-neutral-500 shrink-0">🔊 Auto</span>
              </>
            ) : (
              <span className="text-[9px] text-neutral-600 font-medium flex items-center gap-1.5 mx-auto">
                <Music size={10} /> Sin audio de marca
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
