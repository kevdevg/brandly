import React from 'react';
import { Plus, Type, Square, Circle, Star, Sparkles } from 'lucide-react';
import { TimelineElement } from '../../types';

interface QuickTemplatesProps {
  onAddElement: (element: Partial<TimelineElement>) => void;
}

const TEMPLATES = [
  {
    label: 'Título Grande',
    icon: '📝',
    element: {
      type: 'text' as const,
      content: 'Tu Título Aquí',
      fontSize: 72,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center' as const,
      x: 50, y: 30,
      width: 80, height: 20,
    },
  },
  {
    label: 'Subtítulo',
    icon: '💬',
    element: {
      type: 'text' as const,
      content: 'Subtítulo descriptivo',
      fontSize: 32,
      fontWeight: '400',
      color: '#a1a1aa',
      textAlign: 'center' as const,
      x: 50, y: 55,
      width: 70, height: 10,
    },
  },
  {
    label: 'CTA Button',
    icon: '🔘',
    element: {
      type: 'text' as const,
      content: 'Comprar Ahora →',
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      textBackground: '#8b5cf6',
      textAlign: 'center' as const,
      borderRadius: 12,
      x: 50, y: 80,
      width: 40, height: 8,
    },
  },
  {
    label: 'Caption',
    icon: '📰',
    element: {
      type: 'text' as const,
      content: 'Texto informativo aquí',
      fontSize: 18,
      fontWeight: '500',
      color: '#d4d4d8',
      textAlign: 'left' as const,
      x: 50, y: 70,
      width: 60, height: 8,
    },
  },
  {
    label: 'Fondo Degradado',
    icon: '🌈',
    element: {
      type: 'color' as const,
      content: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      x: 50, y: 50,
      width: 100, height: 100,
    },
  },
  {
    label: 'Overlay Oscuro',
    icon: '🌙',
    element: {
      type: 'color' as const,
      content: 'rgba(0,0,0,0.6)',
      x: 50, y: 50,
      width: 100, height: 100,
      opacity: 60,
    },
  },
  {
    label: 'Viñeta',
    icon: '📐',
    element: {
      type: 'color' as const,
      content: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
      x: 50, y: 50,
      width: 100, height: 100,
    },
  },
  {
    label: 'Texto Neón',
    icon: '✨',
    element: {
      type: 'text' as const,
      content: 'NEÓN',
      fontSize: 64,
      fontWeight: '900',
      color: '#00ffcc',
      textAlign: 'center' as const,
      textShadow: '0 0 20px #00ffcc, 0 0 40px #00ffcc, 0 0 80px #00997a',
      x: 50, y: 50,
      width: 50, height: 15,
    },
  },
];

/**
 * QuickElementTemplates — Pre-made element configurations for quick insertion.
 * One click to add common design elements like titles, CTAs, overlays, etc.
 */
export const QuickElementTemplates: React.FC<QuickTemplatesProps> = ({ onAddElement }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} className="text-amber-400" />
        <span className="text-[10px] font-semibold text-white">Templates Rápidos</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {TEMPLATES.map(tmpl => (
          <button
            key={tmpl.label}
            onClick={() => onAddElement(tmpl.element)}
            title={tmpl.label}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800/50 hover:border-violet-500/30 hover:bg-neutral-800 transition-all text-left group"
          >
            <span className="text-xs">{tmpl.icon}</span>
            <span className="text-[8px] text-neutral-400 group-hover:text-white truncate">{tmpl.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
