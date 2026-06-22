import React, { useState } from 'react';
import { Subtitles, Loader2, X } from 'lucide-react';
import { CAPTION_PRESETS, CaptionStyle, DEFAULT_CAPTION_STYLE } from '../../utils/captionGenerator';

interface CaptionStylePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (style: CaptionStyle) => void;
  isLoading: boolean;
}

/**
 * CaptionStylePicker — Modal for choosing caption style before generating auto-captions.
 */
export const CaptionStylePicker: React.FC<CaptionStylePickerProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(0);

  if (!isOpen) return null;

  const currentStyle = CAPTION_PRESETS[selectedPreset]?.style ?? DEFAULT_CAPTION_STYLE;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-[420px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Subtitles size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Auto-Captions</h3>
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Style Presets */}
        <div className="p-5 space-y-4">
          <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Estilo de Subtítulos</label>
          <div className="grid grid-cols-2 gap-2">
            {CAPTION_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => setSelectedPreset(idx)}
                title={`Estilo ${preset.name}`}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === idx
                    ? 'border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/20'
                    : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-medium text-white">{preset.name}</span>
                {/* Preview */}
                <div
                  className="mt-2 px-2 py-1 rounded text-center text-[10px] leading-snug"
                  style={{
                    color: preset.style.color,
                    background: preset.style.backgroundColor || 'transparent',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Hola, esto es un ejemplo
                </div>
                <div className="mt-1.5 text-[9px] text-neutral-500">
                  {preset.style.fontSize}px · {preset.style.position} · {preset.style.maxWordsPerGroup} palabras
                </div>
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="bg-neutral-950/50 rounded-lg p-3 border border-neutral-800/50">
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Se transcribirá el audio y se generarán subtítulos sincronizados palabra por palabra.
              Los subtítulos se crearán como elementos de texto en una nueva capa.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            title="Cancelar"
            className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onGenerate(currentStyle)}
            disabled={isLoading}
            title="Generar subtítulos automáticos"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Transcribiendo...
              </>
            ) : (
              <>
                <Subtitles size={14} />
                Generar Captions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
