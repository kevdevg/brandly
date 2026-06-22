import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ArrowLeft, Zap, Wrench, Download, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Player, PlayerRef } from '@remotion/player';
import { ExpressTemplate, DesignMD, TimelineElement, TimelineLayer, CompanyProfile } from '../../types';
import { BrandComposition } from '../BrandComposition';
import { ExpressTemplateGallery } from './ExpressTemplateGallery';
import { StoryboardView } from './StoryboardView';
import { SceneFieldEditor } from './SceneFieldEditor';
import { ExpressStylePanel } from './ExpressStylePanel';
import { compileExpressToTimeline, getAspectDimensions, getTemplateDuration } from '../../utils/expressCompiler';

interface ExpressEditorProps {
  designMD: DesignMD;
  company?: CompanyProfile;
  onBack: () => void;
  onUpgradeToPro: (elements: TimelineElement[], layers: TimelineLayer[]) => void;
  onExport: (elements: TimelineElement[], layers: TimelineLayer[], format: 'video' | 'image') => void;
}

type EditorPhase = 'gallery' | 'editing';

/**
 * ExpressEditor — Scene-based storyboard editor.
 * No video editor, no timeline, no toolbar.
 * User picks a template → fills in scenes → exports.
 */
export const ExpressEditor: React.FC<ExpressEditorProps> = ({
  designMD,
  company,
  onBack,
  onUpgradeToPro,
  onExport,
}) => {
  const [phase, setPhase] = useState<EditorPhase>('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<ExpressTemplate | null>(null);
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Style options
  const [bgStyle, setBgStyle] = useState<'solid' | 'gradient' | 'dark'>('gradient');
  const [showLogo, setShowLogo] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0);

  const playerRef = useRef<PlayerRef>(null);

  const handleSelectTemplate = useCallback((template: ExpressTemplate) => {
    setSelectedTemplate(template);
    // Pre-fill field data with empty strings
    const initial: Record<string, string> = {};
    template.scenes.forEach(scene => {
      scene.editableFields.forEach(field => {
        initial[field.id] = '';
      });
    });
    setFieldData(initial);
    setActiveSceneId(template.scenes[0]?.id || null);
    setPhase('editing');
  }, []);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFieldData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  // Compile template to timeline
  const compiled = useMemo(() => {
    if (!selectedTemplate) return null;
    return compileExpressToTimeline(selectedTemplate, fieldData, designMD, company);
  }, [selectedTemplate, fieldData, designMD, company]);

  const totalDuration = selectedTemplate ? getTemplateDuration(selectedTemplate) : 0;
  const fps = 30;
  const totalFrames = Math.max(30, totalDuration * fps);

  const dimensions = selectedTemplate
    ? getAspectDimensions(selectedTemplate.aspectRatio)
    : { w: 1080, h: 1920 };

  const activeScene = selectedTemplate?.scenes.find(s => s.id === activeSceneId) || null;

  const handlePlayToggle = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleUpgrade = () => {
    if (compiled) onUpgradeToPro(compiled.elements, compiled.layers);
  };

  const handleExport = () => {
    if (compiled && selectedTemplate) {
      onExport(compiled.elements, compiled.layers, selectedTemplate.format);
    }
  };

  // Navigate to scene in player
  const handleSelectScene = useCallback((sceneId: string) => {
    setActiveSceneId(sceneId);
    if (!selectedTemplate || !playerRef.current) return;
    // Seek player to scene start
    let frameOffset = 0;
    for (const scene of selectedTemplate.scenes) {
      if (scene.id === sceneId) break;
      frameOffset += scene.durationSeconds * fps;
    }
    playerRef.current.seekTo(frameOffset);
    playerRef.current.pause();
    setIsPlaying(false);
  }, [selectedTemplate, fps]);

  const bgColor = bgStyle === 'dark'
    ? '#111111'
    : bgStyle === 'gradient'
      ? undefined
      : designMD.secondaryColor;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
      {/* ═══ Top Bar ═══ */}
      <div className="h-11 bg-neutral-900/80 border-b border-neutral-800/60 flex items-center px-4 gap-3 shrink-0 backdrop-blur-sm">
        <button
          onClick={phase === 'editing' ? () => setPhase('gallery') : onBack}
          title="Volver"
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-xs"
        >
          <ArrowLeft size={14} />
          {phase === 'editing' ? 'Plantillas' : 'Dashboard'}
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 border border-violet-500/20">
          <Zap size={12} className="text-violet-400" />
          <span className="text-[10px] font-bold text-violet-300 tracking-wider">EXPRESS</span>
        </div>

        {phase === 'editing' && (
          <>
            <button
              onClick={handleUpgrade}
              title="Abrir en Editor Pro con timeline completo"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
            >
              <Wrench size={10} />
              Editor Pro
              <ChevronRight size={10} />
            </button>

            <button
              onClick={handleExport}
              title="Exportar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-900/30"
            >
              <Download size={12} />
              Exportar
            </button>
          </>
        )}
      </div>

      {/* ═══ Content ═══ */}
      {phase === 'gallery' ? (
        <ExpressTemplateGallery
          designMD={designMD}
          onSelectTemplate={handleSelectTemplate}
          brandTemplates={company?.brandTemplates}
          brandName={company?.name}
        />
      ) : selectedTemplate && compiled ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main area: Preview + Right Panel */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Canvas Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-4 overflow-hidden relative min-h-0">
              {/* Subtle pattern */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}
              />

              {/* Template name */}
              <div className="mb-2 flex items-center gap-2 relative z-10 shrink-0">
                <span className="text-lg">{selectedTemplate.icon}</span>
                <span className="text-xs font-semibold text-neutral-400">{selectedTemplate.name}</span>
                <span className="text-[9px] text-neutral-600 font-mono px-1.5 py-0.5 bg-neutral-900 rounded">
                  {selectedTemplate.aspectRatio}
                </span>
                <span className="text-[9px] text-neutral-600 font-mono px-1.5 py-0.5 bg-neutral-900 rounded">
                  {totalDuration}s
                </span>
              </div>

              {/* Player */}
              <div
                className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-neutral-800/40 shrink-0"
                style={{
                  width: selectedTemplate.aspectRatio === '9:16' ? 240
                    : selectedTemplate.aspectRatio === '1:1' ? 320
                    : selectedTemplate.aspectRatio === '4:5' ? 280
                    : 420,
                  aspectRatio: `${dimensions.w} / ${dimensions.h}`,
                  maxHeight: 'calc(100% - 80px)',
                }}
              >
                <Player
                  ref={playerRef}
                  component={BrandComposition}
                  inputProps={{
                    designMD: {
                      ...designMD,
                      secondaryColor: bgColor || designMD.secondaryColor,
                    },
                    timelineElements: compiled.elements,
                    layers: compiled.layers,
                    selectedElementId: null,
                    aspectRatio: selectedTemplate.aspectRatio,
                    textOverlay: '',
                    showLogo,
                    showFrame: false,
                    showBackground: true,
                    brandVisibility: {
                      logo: showLogo,
                      frame: false,
                      background: true,
                    },
                  }}
                  durationInFrames={totalFrames}
                  compositionWidth={dimensions.w}
                  compositionHeight={dimensions.h}
                  fps={fps}
                  style={{ width: '100%', height: '100%' }}
                  controls={false}
                  autoPlay={false}
                  loop
                />

                {overlayOpacity > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}
                  />
                )}
              </div>

              {/* Mini play controls */}
              {selectedTemplate.format === 'video' && (
                <div className="mt-3 flex items-center gap-2 relative z-10 shrink-0">
                  <button
                    onClick={handlePlayToggle}
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                    className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                  </button>
                  <button
                    onClick={() => { playerRef.current?.seekTo(0); setIsPlaying(false); }}
                    title="Reiniciar"
                    className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center transition-colors"
                  >
                    <RotateCcw size={10} />
                  </button>
                  <span className="text-[9px] text-neutral-500 font-mono">{totalDuration}s</span>
                </div>
              )}
            </div>

            {/* Right Panel — Scene Fields */}
            <aside className="w-72 bg-neutral-900 border-l border-neutral-800/60 overflow-y-auto p-4 space-y-5 shrink-0">
              {activeScene ? (
                <SceneFieldEditor
                  scene={activeScene}
                  fieldData={fieldData}
                  onFieldChange={handleFieldChange}
                  designMD={designMD}
                />
              ) : (
                <div className="text-center text-neutral-500 text-xs py-8">
                  Selecciona una escena del storyboard
                </div>
              )}

              <hr className="border-neutral-800/50" />

              {/* Style */}
              <ExpressStylePanel
                designMD={designMD}
                bgStyle={bgStyle}
                setBgStyle={setBgStyle}
                showLogo={showLogo}
                setShowLogo={setShowLogo}
                overlayOpacity={overlayOpacity}
                setOverlayOpacity={setOverlayOpacity}
              />

              <hr className="border-neutral-800/50" />

              <button
                onClick={() => setPhase('gallery')}
                title="Elegir otra plantilla"
                className="w-full py-2 rounded-lg bg-neutral-800/50 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={10} />
                Cambiar plantilla
              </button>
            </aside>
          </div>

          {/* Storyboard (bottom strip — video only) */}
          {selectedTemplate.format === 'video' && (
            <StoryboardView
              scenes={selectedTemplate.scenes}
              activeSceneId={activeSceneId}
              onSelectScene={handleSelectScene}
              fieldData={fieldData}
              totalDuration={totalDuration}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};
