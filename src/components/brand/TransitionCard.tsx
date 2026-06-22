import React, { useState } from 'react';

interface TransitionCardProps {
  value: string;
  label: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Compact transition selector with CSS micro-animation on hover.
 */
export const TransitionCard: React.FC<TransitionCardProps> = ({
  value,
  label,
  icon,
  selected,
  onSelect,
}) => {
  const [hovering, setHovering] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      title={`Transición: ${label}`}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all text-left group ${
        selected
          ? 'bg-violet-600/20 border-violet-500/60 text-white'
          : 'bg-neutral-950/50 border-neutral-800/60 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 hover:bg-neutral-900'
      }`}
    >
      <span 
        className="w-5 h-5 flex items-center justify-center text-sm shrink-0 transition-all duration-500"
        style={getAnimationStyle(value, hovering)}
      >
        {icon}
      </span>
      <span className="text-[11px] font-medium leading-none truncate">{label}</span>
    </button>
  );
};

function getAnimationStyle(value: string, hovering: boolean): React.CSSProperties {
  if (!hovering) return {};

  switch (value) {
    case 'fade':
      return { opacity: 0, transition: 'opacity 0.4s ease-in-out', animation: 'fadeInCard 0.6s ease forwards' };
    case 'slideUp':
      return { transform: 'translateY(6px)', animation: 'slideUpCard 0.5s ease forwards' };
    case 'slideRight':
      return { transform: 'translateX(-6px)', animation: 'slideRightCard 0.5s ease forwards' };
    case 'typewriter':
      return { opacity: 0.3, animation: 'typewriterCard 0.6s steps(4) forwards' };
    case 'bounce':
      return { animation: 'bounceCard 0.6s ease forwards' };
    case 'scale':
      return { transform: 'scale(0.3)', animation: 'scaleCard 0.4s ease forwards' };
    case 'crossfade':
      return { opacity: 0.3, animation: 'fadeInCard 0.8s ease forwards' };
    case 'dipToBlack':
      return { opacity: 0, animation: 'dipToBlackCard 0.8s ease forwards' };
    case 'flash':
      return { animation: 'flashCard 0.4s ease forwards' };
    default:
      return {};
  }
}
