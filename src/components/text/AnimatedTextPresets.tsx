import React from 'react';
import { Sparkles } from 'lucide-react';
import { TimelineElement } from '../../types';

interface TextAnimationPreset {
  name: string;
  emoji: string;
  apply: (el: TimelineElement) => Partial<TimelineElement>;
}

const TEXT_PRESETS: TextAnimationPreset[] = [
  {
    name: 'Título Grande',
    emoji: '📢',
    apply: () => ({
      fontSize: 72,
      fontWeight: 900,
      color: '#ffffff',
      textAlign: 'center' as const,
      transitionIn: { type: 'scale' as const, duration: 15 },
      transitionOut: { type: 'fade' as const, duration: 10 },
    }),
  },
  {
    name: 'Subtítulo',
    emoji: '💬',
    apply: () => ({
      fontSize: 32,
      fontWeight: 400,
      color: '#e0e0e0',
      textAlign: 'center' as const,
      textBackground: '#000000AA',
      textBackgroundPadding: 10,
      textBackgroundRadius: 6,
      transitionIn: { type: 'fade' as const, duration: 10 },
      transitionOut: { type: 'fade' as const, duration: 10 },
    }),
  },
  {
    name: 'Neon',
    emoji: '✨',
    apply: () => ({
      fontSize: 56,
      fontWeight: 700,
      color: '#00ffaa',
      textAlign: 'center' as const,
      shadowOffset: 0,
      shadowBlur: 20,
      transitionIn: { type: 'scale' as const, duration: 12 },
    }),
  },
  {
    name: 'CTA / Callout',
    emoji: '👉',
    apply: () => ({
      fontSize: 42,
      fontWeight: 800,
      color: '#ffffff',
      textAlign: 'center' as const,
      textBackground: '#7c3aedDD',
      textBackgroundPadding: 14,
      textBackgroundRadius: 12,
      transitionIn: { type: 'slideRight' as const, duration: 15 },
      transitionOut: { type: 'slideRight' as const, duration: 12 },
    }),
  },
  {
    name: 'Lower Third',
    emoji: '📋',
    apply: () => ({
      fontSize: 28,
      fontWeight: 600,
      color: '#ffffff',
      textAlign: 'left' as const,
      textBackground: '#000000CC',
      textBackgroundPadding: 10,
      textBackgroundRadius: 4,
      x: 8,
      y: 85,
      transitionIn: { type: 'slideRight' as const, duration: 12 },
      transitionOut: { type: 'slideRight' as const, duration: 10 },
    }),
  },
  {
    name: 'Tipo Machine',
    emoji: '⌨️',
    apply: () => ({
      fontSize: 36,
      fontWeight: 400,
      fontFamily: 'Fira Code',
      color: '#00ff88',
      textAlign: 'left' as const,
      textBackground: '#0a0a0aEE',
      textBackgroundPadding: 16,
      textBackgroundRadius: 8,
      transitionIn: { type: 'fade' as const, duration: 20 },
    }),
  },
  {
    name: 'Pop',
    emoji: '💥',
    apply: () => ({
      fontSize: 64,
      fontWeight: 900,
      color: '#FF6B6B',
      textAlign: 'center' as const,
      rotation: -3,
      transitionIn: { type: 'scale' as const, duration: 8 },
      transitionOut: { type: 'scale' as const, duration: 8 },
    }),
  },
  {
    name: 'Cine',
    emoji: '🎬',
    apply: () => ({
      fontSize: 48,
      fontWeight: 300,
      fontFamily: 'Playfair Display',
      color: '#f5f5dc',
      textAlign: 'center' as const,
      letterSpacing: 8,
      transitionIn: { type: 'fade' as const, duration: 25 },
      transitionOut: { type: 'fade' as const, duration: 25 },
    }),
  },
];

interface AnimatedTextPresetsProps {
  element: TimelineElement;
  onApplyPreset: (updates: Partial<TimelineElement>) => void;
}

/**
 * AnimatedTextPresets — Grid of text style presets that apply animation + styling in one click.
 */
export const AnimatedTextPresets: React.FC<AnimatedTextPresetsProps> = ({
  element,
  onApplyPreset,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} className="text-amber-400" />
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Presets Animados</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onApplyPreset(preset.apply(element))}
            title={`Aplicar preset: ${preset.name}`}
            className="px-2 py-2 rounded-lg border border-neutral-800 bg-neutral-950/50 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">{preset.emoji}</span>
              <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white transition-colors">
                {preset.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
