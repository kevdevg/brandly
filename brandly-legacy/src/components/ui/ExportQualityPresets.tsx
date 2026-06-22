import React from 'react';

interface ExportQualityPresetsProps {
  selectedFormat: string;
  selectedQuality: string;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
}

const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4', icon: '🎬', desc: 'Mejor compatibilidad' },
  { value: 'webm', label: 'WebM', icon: '🌐', desc: 'Web optimizado' },
  { value: 'gif', label: 'GIF', icon: '✨', desc: 'Animación ligera' },
  { value: 'png', label: 'PNG', icon: '🖼️', desc: 'Frame estático' },
  { value: 'jpeg', label: 'JPEG', icon: '📷', desc: 'Foto comprimida' },
];

const QUALITY_PRESETS = [
  { value: 'draft', label: 'Draft', desc: '480p · Rápido · Preview', color: 'text-neutral-400' },
  { value: 'standard', label: 'Standard', desc: '720p · Balanceado', color: 'text-sky-400' },
  { value: 'high', label: 'High', desc: '1080p · Alta calidad', color: 'text-violet-400' },
  { value: 'ultra', label: 'Ultra', desc: '4K · Máxima calidad', color: 'text-amber-400' },
];

/**
 * ExportQualityPresets — Format and quality selector for video/image export.
 * Provides quick access to common export configurations.
 */
export const ExportQualityPresets: React.FC<ExportQualityPresetsProps> = ({
  selectedFormat,
  selectedQuality,
  onFormatChange,
  onQualityChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Format selector */}
      <div>
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider block mb-1.5">Formato</span>
        <div className="grid grid-cols-5 gap-1">
          {FORMAT_OPTIONS.map(fmt => (
            <button
              key={fmt.value}
              onClick={() => onFormatChange(fmt.value)}
              title={fmt.desc}
              className={`py-1.5 rounded-lg text-[8px] font-medium transition-all border text-center ${
                selectedFormat === fmt.value
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="text-xs block">{fmt.icon}</span>
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div>
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider block mb-1.5">Calidad</span>
        <div className="grid grid-cols-2 gap-1">
          {QUALITY_PRESETS.map(q => (
            <button
              key={q.value}
              onClick={() => onQualityChange(q.value)}
              title={q.desc}
              className={`py-1.5 px-2 rounded-lg text-left transition-all border ${
                selectedQuality === q.value
                  ? 'bg-violet-500/15 border-violet-500/50'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className={`text-[9px] font-semibold block ${selectedQuality === q.value ? 'text-white' : q.color}`}>
                {q.label}
              </span>
              <span className="text-[7px] text-neutral-600 block">{q.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
