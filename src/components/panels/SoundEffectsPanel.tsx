import React, { useState, useCallback } from 'react';
import { Search, Volume2, Plus, Loader2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TimelineElement } from '../../types';

interface SfxCategory {
  name: string;
  emoji: string;
  effects: SoundEffect[];
}

interface SoundEffect {
  name: string;
  description: string;
  durationSec: number;
  // These would be actual URLs in production — for now they are placeholders
  // that get generated/loaded on demand
  generator: 'tone' | 'noise' | 'click';
  frequency?: number;
}

const SFX_CATEGORIES: SfxCategory[] = [
  {
    name: 'Transiciones',
    emoji: '🔄',
    effects: [
      { name: 'Whoosh', description: 'Paso rápido', durationSec: 0.8, generator: 'noise' },
      { name: 'Swoosh Suave', description: 'Movimiento suave', durationSec: 0.6, generator: 'noise' },
      { name: 'Click', description: 'Click mecánico', durationSec: 0.2, generator: 'click' },
      { name: 'Pop', description: 'Aparición', durationSec: 0.3, generator: 'click', frequency: 800 },
    ],
  },
  {
    name: 'UI / Notificaciones',
    emoji: '🔔',
    effects: [
      { name: 'Ding', description: 'Notificación', durationSec: 0.5, generator: 'tone', frequency: 880 },
      { name: 'Beep', description: 'Alerta simple', durationSec: 0.3, generator: 'tone', frequency: 440 },
      { name: 'Error', description: 'Error/rechazo', durationSec: 0.4, generator: 'tone', frequency: 220 },
      { name: 'Success', description: 'Éxito/aprobado', durationSec: 0.6, generator: 'tone', frequency: 660 },
    ],
  },
  {
    name: 'Impacto',
    emoji: '💥',
    effects: [
      { name: 'Boom', description: 'Impacto bajo', durationSec: 1.0, generator: 'noise' },
      { name: 'Hit Suave', description: 'Golpe leve', durationSec: 0.4, generator: 'noise' },
      { name: 'Drum Hit', description: 'Tambor', durationSec: 0.5, generator: 'tone', frequency: 80 },
    ],
  },
  {
    name: 'Ambientes',
    emoji: '🌊',
    effects: [
      { name: 'Lluvia', description: 'Sonido de lluvia', durationSec: 3.0, generator: 'noise' },
      { name: 'Viento', description: 'Brisa suave', durationSec: 3.0, generator: 'noise' },
      { name: 'Estática', description: 'Ruido blanco', durationSec: 2.0, generator: 'noise' },
    ],
  },
];

/**
 * Generate a simple sound effect using Web Audio API and return as blob URL.
 */
function generateSfx(effect: SoundEffect): string {
  const ctx = new OfflineAudioContext(1, 44100 * effect.durationSec, 44100);

  if (effect.generator === 'tone') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = effect.frequency ?? 440;
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, effect.durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(effect.durationSec);
  } else if (effect.generator === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = effect.frequency ?? 1000;
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, effect.durationSec * 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(effect.durationSec);
  } else {
    // Noise generator
    const bufferSize = ctx.sampleRate * effect.durationSec;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, effect.durationSec * 0.9);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  // OfflineAudioContext renders synchronously in terms of API but returns a promise
  // We'll create a placeholder and update async
  return ''; // Will be replaced
}

/**
 * Generate SFX and return a blob URL asynchronously.
 */
async function generateSfxAsync(effect: SoundEffect): Promise<string> {
  const sampleRate = 44100;
  const duration = effect.durationSec;
  const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

  if (effect.generator === 'tone') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = effect.frequency ?? 440;
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(duration);
  } else if (effect.generator === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = effect.frequency ?? 1000;
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration * 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(duration);
  } else {
    const bufferSize = sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration * 0.9);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  const rendered = await ctx.startRendering();

  // Convert to WAV blob
  const numChannels = 1;
  const length = rendered.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, rendered.length * numChannels * 2, true);

  const channelData = rendered.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < rendered.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

interface SoundEffectsPanelProps {
  onClose: () => void;
}

/**
 * SoundEffectsPanel — Categorized SFX library with Web Audio generated effects.
 */
export const SoundEffectsPanel: React.FC<SoundEffectsPanelProps> = ({ onClose }) => {
  const {
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    setTimelineElements,
    setSelectedElementId,
    playerRef,
    durationInFrames,
  } = useEditor();

  const [search, setSearch] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [insertingId, setInsertingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(SFX_CATEGORIES.map(c => [c.name, true]))
  );

  // Preview a sound effect
  const handlePreview = useCallback(async (effect: SoundEffect) => {
    const id = effect.name;
    setPreviewingId(id);
    try {
      const url = await generateSfxAsync(effect);
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play();
      audio.onended = () => {
        setPreviewingId(null);
        URL.revokeObjectURL(url);
      };
    } catch {
      setPreviewingId(null);
    }
  }, []);

  // Insert into timeline
  const handleInsert = useCallback(async (effect: SoundEffect) => {
    const id = effect.name;
    setInsertingId(id);
    try {
      const url = await generateSfxAsync(effect);

      // Upload to server for persistence
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `sfx-${effect.name.toLowerCase().replace(/\s+/g, '-')}.wav`, { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });

      let persistentUrl = url;
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        persistentUrl = uploadData.url;
        URL.revokeObjectURL(url);
      }

      // Find or create audio layer
      let targetLayerId = activeLayerId;
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (!activeLayer || activeLayer.type !== 'audio') {
        let audioLayer = layers.find(l => l.type === 'audio');
        if (!audioLayer) {
          audioLayer = { id: 'layer-audio-' + Date.now(), name: 'Audio', type: 'audio' };
          setLayers(prev => [...prev, audioLayer!]);
        }
        targetLayerId = audioLayer.id;
        setActiveLayerId(targetLayerId);
      }

      const currentFrame = playerRef.current?.getCurrentFrame() || 0;
      const newElement: TimelineElement = {
        id: 'sfx-' + Date.now(),
        layerId: targetLayerId,
        type: 'audio',
        content: persistentUrl,
        startFrame: currentFrame,
        endFrame: Math.min(durationInFrames, currentFrame + Math.round(effect.durationSec * 30)),
        x: 0,
        y: 0,
        originalFileName: `SFX: ${effect.name}`,
      };

      setTimelineElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
    } catch (err) {
      console.error('SFX insert error:', err);
    } finally {
      setInsertingId(null);
    }
  }, [activeLayerId, layers, playerRef, durationInFrames, setLayers, setActiveLayerId, setTimelineElements, setSelectedElementId]);

  // Filter
  const filteredCategories = SFX_CATEGORIES
    .map(cat => ({
      ...cat,
      effects: cat.effects.filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.effects.length > 0);

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Volume2 size={14} className="text-emerald-400" />
          Efectos de Sonido
        </h3>
        <button onClick={onClose} title="Cerrar" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-neutral-800/50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar efectos..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filteredCategories.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.name]: !prev[cat.name] }))}
              title={`Categoría ${cat.name}`}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors text-left"
            >
              <span className="text-sm">{cat.emoji}</span>
              <span className="text-[11px] font-semibold text-neutral-300 flex-1">{cat.name}</span>
              <span className="text-[9px] text-neutral-600">{cat.effects.length}</span>
            </button>

            {expandedCategories[cat.name] && (
              <div className="ml-1 space-y-0.5 mt-0.5">
                {cat.effects.map((effect) => {
                  const effectId = effect.name;
                  const isPreviewing = previewingId === effectId;
                  const isInserting = insertingId === effectId;

                  return (
                    <div
                      key={effectId}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-800/40 transition-colors group"
                    >
                      {/* Preview button */}
                      <button
                        onClick={() => handlePreview(effect)}
                        disabled={isPreviewing}
                        title={`Previsualizar ${effect.name}`}
                        className={`p-1 rounded transition-colors ${
                          isPreviewing
                            ? 'text-emerald-400 animate-pulse'
                            : 'text-neutral-600 hover:text-emerald-400'
                        }`}
                      >
                        <Volume2 size={12} />
                      </button>

                      {/* Name + Desc */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-neutral-300 truncate">{effect.name}</div>
                        <div className="text-[8px] text-neutral-600 truncate">{effect.description} · {effect.durationSec}s</div>
                      </div>

                      {/* Insert button */}
                      <button
                        onClick={() => handleInsert(effect)}
                        disabled={isInserting}
                        title={`Insertar ${effect.name}`}
                        className="p-1 rounded text-neutral-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {isInserting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-6 text-neutral-600 text-xs">
            <Volume2 size={24} className="mx-auto mb-2 opacity-30" />
            <p>No se encontraron efectos</p>
          </div>
        )}
      </div>
    </div>
  );
};
