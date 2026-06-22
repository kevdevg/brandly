import React, { useState, useEffect, useCallback } from 'react';
import { X, Music, Play, Pause, Clock, Loader2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { FileDropZone } from '../ui/FileDropZone';
import { uploadMedia } from '../../utils/mediaUploader';
import { useAudioPreview } from '../../hooks/useAudioPreview';
import { getAudioDuration, formatDuration } from '../../utils/audioMetadata';
import { AudioWaveformCanvas } from '../timeline/AudioWaveformCanvas';

interface AudioPanelProps {
  onClose: () => void;
}

interface AudioItem {
  src: string;
  name: string;
  duration: number | null;
}

/**
 * Panel for adding audio files. Draggable to timeline.
 * Auto-routes to audio layers. Supports preview and waveform.
 */
export const AudioPanel: React.FC<AudioPanelProps> = ({ onClose }) => {
  const { designMD } = useEditor();
  const [localAudios, setLocalAudios] = useState<AudioItem[]>([]);
  const [brandDuration, setBrandDuration] = useState<number | null>(null);
  const preview = useAudioPreview();
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load brand audio duration
  useEffect(() => {
    if (designMD.brandAudioUrl) {
      getAudioDuration(designMD.brandAudioUrl).then(d => setBrandDuration(d));
    }
  }, [designMD.brandAudioUrl]);

  const handleUpload = useCallback(async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    if (audioFiles.length === 0) return;

    setIsUploading(true);
    try {
      const items: AudioItem[] = [];

      for (const file of audioFiles) {
        const result = await uploadMedia(file);
        let duration: number | null = null;
        try {
          duration = await getAudioDuration(result.url);
        } catch {}
        items.push({ src: result.url, name: result.originalName, duration });
      }

      setLocalAudios(prev => [...items, ...prev]);
    } catch (err) {
      console.error('Audio upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleTogglePreview = useCallback((src: string, idx: number) => {
    if (playingIdx === idx) {
      preview.pause();
      setPlayingIdx(null);
    } else {
      preview.setSrc(src);
      preview.play();
      setPlayingIdx(idx);
    }
  }, [playingIdx, preview]);

  // Stop preview when panel closes
  useEffect(() => {
    return () => {
      preview.pause();
    };
  }, []);

  const allAudios = [...localAudios];
  const hasBrandAudio = !!designMD.brandAudioUrl;

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Music size={14} className="text-violet-400" />
          Audio
        </h3>
        <button onClick={onClose} title="Cerrar Panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {/* Upload */}
        <FileDropZone
          accept="audio/*"
          multiple
          onFiles={handleUpload}
          label={isUploading ? 'Subiendo...' : "Subir audio"}
          sublabel={isUploading ? undefined : "MP3, WAV, OGG"}
        />
        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-2 text-violet-400">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[10px] font-medium">Subiendo al servidor...</span>
          </div>
        )}

        {/* Brand Audio */}
        {hasBrandAudio && (
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Audio de Marca</span>
            <div
              className="flex flex-col gap-2 p-2.5 bg-neutral-800/50 border border-neutral-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-violet-500/40 transition-colors group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', designMD.brandAudioUrl!);
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'audio', src: designMD.brandAudioUrl }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleTogglePreview(designMD.brandAudioUrl!, -1); }}
                  className="w-8 h-8 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 hover:bg-violet-600/40 transition-colors"
                  title={playingIdx === -1 ? "Pausar Preview" : "Escuchar Preview"}
                >
                  {playingIdx === -1 ? <Pause size={12} className="text-violet-300" /> : <Play size={12} className="text-violet-400 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-white block truncate">Jingle de Marca</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-neutral-500">Arrastrar al timeline</span>
                    {brandDuration !== null && (
                      <span className="text-[9px] text-neutral-600 font-mono flex items-center gap-0.5">
                        <Clock size={8} /> {formatDuration(brandDuration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Mini Waveform */}
              <div className="bg-neutral-900/50 rounded overflow-hidden">
                <AudioWaveformCanvas
                  src={designMD.brandAudioUrl!}
                  width={220}
                  height={24}
                  color="rgba(139, 92, 246, 0.4)"
                  resolution={100}
                />
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Audios */}
        {localAudios.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Mis Audios</span>
            <div className="space-y-2">
              {localAudios.map((audio, i) => (
                <div
                  key={`audio-${i}`}
                  className="flex flex-col gap-2 p-2.5 bg-neutral-950/50 border border-neutral-800/60 rounded-lg cursor-grab active:cursor-grabbing hover:border-neutral-700 transition-colors group"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', audio.src);
                    e.dataTransfer.setData('application/json', JSON.stringify({ 
                      type: 'audio', 
                      src: audio.src,
                      fileName: audio.name,
                    }));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePreview(audio.src, i); }}
                      className="w-8 h-8 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 hover:bg-neutral-700 transition-colors"
                      title={playingIdx === i ? "Pausar Preview" : "Escuchar Preview"}
                    >
                      {playingIdx === i ? <Pause size={12} className="text-violet-300" /> : <Play size={12} className="text-neutral-400 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-neutral-300 block truncate" title={audio.name}>{audio.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-neutral-600">Arrastrar al timeline</span>
                        {audio.duration !== null && (
                          <span className="text-[9px] text-neutral-600 font-mono flex items-center gap-0.5">
                            <Clock size={8} /> {formatDuration(audio.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Mini Waveform */}
                  <div className="bg-neutral-900/30 rounded overflow-hidden">
                    <AudioWaveformCanvas
                      src={audio.src}
                      width={220}
                      height={20}
                      color="rgba(129, 140, 248, 0.35)"
                      resolution={80}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasBrandAudio && localAudios.length === 0 && (
          <div className="text-center py-6 text-neutral-500">
            <Music size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">Sin audio disponible</p>
            <p className="text-[10px] mt-1">Sube archivos de audio o configura el jingle de marca</p>
          </div>
        )}
      </div>
    </div>
  );
};
