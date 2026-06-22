import React, { useState, useEffect } from 'react';
import { Music, Trash2, Wand2, Loader2, Volume2, VolumeX, Subtitles } from 'lucide-react';
import { TimelineElement, DesignMD } from '../../types';
import { AudioWaveformCanvas } from '../timeline/AudioWaveformCanvas';
import { formatDuration, getAudioDuration } from '../../utils/audioMetadata';
import { CaptionStylePicker } from '../captions/CaptionStylePicker';
import { generateCaptionElements, CaptionStyle } from '../../utils/captionGenerator';

interface AudioElementPropertiesProps {
  element: TimelineElement;
  elementIndex: number;
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  setSelectedElementId: (id: string | null) => void;
  timeUnit: 'frames' | 'seconds';
  activeLayerId: string;
  timelineElements: TimelineElement[];
}

/**
 * Properties panel for audio elements.
 * Shows volume, fade in/out, waveform preview, and subtitle generation.
 */
export const AudioElementProperties: React.FC<AudioElementPropertiesProps> = ({
  element: el,
  elementIndex: i,
  setTimelineElements,
  setSelectedElementId,
  timeUnit,
  activeLayerId,
  timelineElements,
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [showCaptionPicker, setShowCaptionPicker] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  const update = (updates: Partial<TimelineElement>) => {
    setTimelineElements(prev => prev.map((e, idx) => idx === i ? { ...e, ...updates } : e));
  };

  // Load audio duration
  useEffect(() => {
    if (el.content) {
      getAudioDuration(el.content).then(d => setAudioDuration(d));
    }
  }, [el.content]);

  const clipDuration = el.endFrame - el.startFrame;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2">
          <Music size={14} className="text-violet-400" />
          Audio
        </h2>
        <button 
          onClick={() => {
            setTimelineElements(prev => prev.filter(e => e.id !== el.id));
            setSelectedElementId(null);
          }}
          title="Eliminar Audio"
          className="text-neutral-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1 space-y-5">

        {/* ═══ Waveform Preview ═══ */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Forma de Onda</label>
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 relative overflow-hidden">
            <AudioWaveformCanvas
              src={el.content}
              width={240}
              height={48}
              color="rgba(129, 140, 248, 0.6)"
            />
            {audioDuration !== null && (
              <div className="absolute bottom-1 right-2 text-[9px] text-neutral-500 font-mono">
                {formatDuration(audioDuration)}
              </div>
            )}
          </div>
          {el.originalFileName && (
            <p className="text-[9px] text-neutral-600 mt-1 truncate">{el.originalFileName}</p>
          )}
        </div>

        {/* ═══ Volume ═══ */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Volumen</label>
            <span className="text-[10px] text-neutral-400 font-mono">{Math.round((el.volume ?? 1) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ volume: el.volume === 0 ? 1 : 0 })}
              className={`p-1.5 rounded-md transition-colors ${el.volume === 0 ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
              title={el.volume === 0 ? "Activar Sonido" : "Silenciar"}
            >
              {el.volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input 
              type="range"
              min="0" max="200" step="1"
              value={Math.round((el.volume ?? 1) * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              className="flex-1 accent-violet-500 h-1"
              title="Volumen del clip"
            />
          </div>
        </div>

        {/* ═══ Fade In / Out ═══ */}
        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Fundidos</label>

          {/* Fade In */}
          <div>
            <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
              <span>Fade In</span>
              <span className="font-mono">
                {el.fadeInFrames ?? 0}f ({((el.fadeInFrames ?? 0) / 30).toFixed(1)}s)
              </span>
            </div>
            <input 
              type="range"
              min="0" max={Math.floor(clipDuration / 2)} step="1"
              value={el.fadeInFrames ?? 0}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                update({ fadeInFrames: v > 0 ? v : undefined });
              }}
              className="w-full accent-amber-500 h-1"
              title="Duración del fundido de entrada"
            />
          </div>

          {/* Fade Out */}
          <div>
            <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
              <span>Fade Out</span>
              <span className="font-mono">
                {el.fadeOutFrames ?? 0}f ({((el.fadeOutFrames ?? 0) / 30).toFixed(1)}s)
              </span>
            </div>
            <input 
              type="range"
              min="0" max={Math.floor(clipDuration / 2)} step="1"
              value={el.fadeOutFrames ?? 0}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                update({ fadeOutFrames: v > 0 ? v : undefined });
              }}
              className="w-full accent-amber-500 h-1"
              title="Duración del fundido de salida"
            />
          </div>

          {/* Quick Fade Presets */}
          <div className="flex gap-1.5">
            {[
              { label: 'Sin Fade', fadeIn: 0, fadeOut: 0 },
              { label: 'Suave', fadeIn: 15, fadeOut: 15 },
              { label: 'Largo', fadeIn: 45, fadeOut: 45 },
            ].map(preset => {
              const isActive = (el.fadeInFrames ?? 0) === preset.fadeIn && (el.fadeOutFrames ?? 0) === preset.fadeOut;
              return (
                <button
                  key={preset.label}
                  onClick={() => update({ 
                    fadeInFrames: preset.fadeIn > 0 ? preset.fadeIn : undefined,
                    fadeOutFrames: preset.fadeOut > 0 ? preset.fadeOut : undefined,
                  })}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                    isActive
                      ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                  }`}
                  title={preset.label}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ Timing ═══ */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Tiempos</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-0.5">Inicio ({timeUnit === 'frames' ? 'f' : 's'})</label>
              <input 
                type="number"
                step={timeUnit === 'seconds' ? 0.01 : 1}
                value={timeUnit === 'frames' ? el.startFrame : Number((el.startFrame / 30).toFixed(2))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  update({ startFrame: timeUnit === 'seconds' ? Math.round(val * 30) : Math.round(val) });
                }}
                className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 mb-0.5">Fin ({timeUnit === 'frames' ? 'f' : 's'})</label>
              <input 
                type="number"
                step={timeUnit === 'seconds' ? 0.01 : 1}
                value={timeUnit === 'frames' ? el.endFrame : Number((el.endFrame / 30).toFixed(2))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  update({ endFrame: timeUnit === 'seconds' ? Math.round(val * 30) : Math.round(val) });
                }}
                className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-violet-500/50"
              />
            </div>
          </div>
        </div>

        {/* ═══ Subtítulos ═══ */}
        <div className="space-y-2">
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Subtítulos</label>
          <button
            disabled={isTranscribing}
            onClick={async () => {
              try {
                setIsTranscribing(true);
                const res = await fetch(el.content);
                const blob = await res.blob();
                const file = new File([blob], "audio.mp3", { type: el.content.startsWith("data:") ? "audio/mpeg" : blob.type });
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                if (data.text) {
                  const newTextEl: TimelineElement = {
                    id: Date.now().toString(),
                    layerId: activeLayerId,
                    type: 'text',
                    content: data.text,
                    startFrame: el.startFrame,
                    endFrame: el.endFrame,
                    x: 20, y: 80,
                    shadowOffset: 3, shadowBlur: 6
                  };
                  setTimelineElements(prev => [...prev, newTextEl]);
                }
              } catch (err) {
                console.error("Error generating subtitles:", err);
                alert("Error al generar subtítulos.");
              } finally {
                setIsTranscribing(false);
              }
            }}
            title="Generar Subtítulos Automáticos"
            className={`w-full font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs ${isTranscribing ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
          >
            {isTranscribing ? (
              <><Loader2 size={12} className="animate-spin" /> Transcribiendo...</>
            ) : (
              <><Wand2 size={12} /> Generar Subtítulos</>
            )}
          </button>
          <p className="text-[9px] text-neutral-600 text-center">Whisper Large V3 (Groq)</p>

          {/* Auto-Captions Button */}
          <button
            onClick={() => setShowCaptionPicker(true)}
            title="Generar subtítulos sincronizados palabra por palabra"
            className="w-full font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
          >
            <Subtitles size={12} /> Auto-Captions (Palabra x Palabra)
          </button>
        </div>
      </div>

      {/* Caption Style Picker Modal */}
      <CaptionStylePicker
        isOpen={showCaptionPicker}
        onClose={() => setShowCaptionPicker(false)}
        isLoading={isGeneratingCaptions}
        onGenerate={async (style: CaptionStyle) => {
          try {
            setIsGeneratingCaptions(true);
            // 1. Fetch audio file
            const res = await fetch(el.content);
            const blob = await res.blob();
            const file = new File([blob], "audio.mp3", { type: blob.type || "audio/mpeg" });
            const formData = new FormData();
            formData.append('file', file);

            // 2. Transcribe with word-level timestamps
            const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();

            if (!data.words || data.words.length === 0) {
              alert('No se detectaron palabras en el audio.');
              return;
            }

            // 3. Create captions layer
            const captionLayerId = 'layer-captions-' + Date.now();

            // 4. Generate caption elements
            const captionElements = generateCaptionElements(
              data.words,
              30, // fps
              el.startFrame,
              captionLayerId,
              style,
            );

            // 5. Add layer and elements
            setTimelineElements(prev => [...prev, ...captionElements]);
            setShowCaptionPicker(false);
          } catch (err) {
            console.error('Auto-caption error:', err);
            alert('Error al generar auto-captions.');
          } finally {
            setIsGeneratingCaptions(false);
          }
        }}
      />
    </div>
  );
};
