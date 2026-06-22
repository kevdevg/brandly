import React from 'react';
import { TimelineElement } from '../../types';

interface TextStylePresetsProps {
  element: TimelineElement;
  onUpdate: (updates: Partial<TimelineElement>) => void;
}

const TEXT_STYLE_PRESETS = [
  {
    name: '📢 Título',
    desc: 'Título grande y bold',
    styles: { fontSize: 72, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 2, lineHeight: 1.1 },
  },
  {
    name: '📝 Subtítulo',
    desc: 'Subtítulo medio y semi-bold',
    styles: { fontSize: 48, fontWeight: 600, textTransform: 'none' as const, letterSpacing: 0, lineHeight: 1.3 },
  },
  {
    name: '💬 Caption',
    desc: 'Texto de caption pequeño',
    styles: { fontSize: 28, fontWeight: 400, textTransform: 'none' as const, letterSpacing: 1, lineHeight: 1.4 },
  },
  {
    name: '✨ Elegante',
    desc: 'Texto elegante con spacing',
    styles: { fontSize: 56, fontWeight: 300, textTransform: 'uppercase' as const, letterSpacing: 8, lineHeight: 1.5 },
  },
  {
    name: '🔥 Impacto',
    desc: 'Bold con sombra fuerte',
    styles: { fontSize: 64, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: -1, lineHeight: 1.0, shadowOffset: 4, shadowBlur: 8 },
  },
  {
    name: '🎀 Delicado',
    desc: 'Light italic suave',
    styles: { fontSize: 42, fontWeight: 300, fontStyle: 'italic' as const, textTransform: 'none' as const, letterSpacing: 2, lineHeight: 1.6 },
  },
  {
    name: '📊 Dato',
    desc: 'Monospace para datos/números',
    styles: { fontSize: 36, fontWeight: 500, fontFamily: 'JetBrains Mono', textTransform: 'none' as const, letterSpacing: 0, lineHeight: 1.3 },
  },
  {
    name: '🏷️ Tag',
    desc: 'Badge pequeño uppercase',
    styles: { fontSize: 20, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 4, lineHeight: 1.2, textBackgroundColor: 'rgba(139,92,246,0.3)', textBackgroundPadding: 8, textBackgroundRadius: 4 },
  },
];

/**
 * TextStylePresets — Quick-apply pre-designed text style configurations.
 * Each preset adjusts fontSize, fontWeight, transform, spacing, and optional effects.
 */
export const TextStylePresets: React.FC<TextStylePresetsProps> = ({ element, onUpdate }) => {
  return (
    <div className="space-y-1.5">
      <span className="text-[9px] text-neutral-500 block">Estilos Prediseñados</span>
      <div className="grid grid-cols-2 gap-1">
        {TEXT_STYLE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onUpdate(preset.styles)}
            title={preset.desc}
            className="py-1.5 px-2 rounded-lg text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-violet-300 hover:border-violet-500/30 transition-all text-left"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};
