import React from 'react';
import { Platform } from '../../types';
import { PLATFORM_CONFIG } from '../../data/defaults';

interface PlatformIconsProps {
  platforms: Platform[];
  size?: 'sm' | 'md';
  max?: number;
}

/**
 * Renders a row of social platform emoji icons with tooltips.
 * Truncates to `max` items and shows "+N" overflow.
 */
export const PlatformIcons: React.FC<PlatformIconsProps> = ({
  platforms,
  size = 'sm',
  max = 4,
}) => {
  const visible = platforms.slice(0, max);
  const overflow = platforms.length - max;

  return (
    <div className="flex items-center gap-0.5">
      {visible.map(p => {
        const cfg = PLATFORM_CONFIG[p];
        return (
          <span
            key={p}
            title={cfg.label}
            className={`inline-flex items-center justify-center rounded-md transition-transform hover:scale-110 ${
              size === 'sm' ? 'w-5 h-5 text-[11px]' : 'w-6 h-6 text-sm'
            }`}
            style={{ backgroundColor: `${cfg.color}15` }}
          >
            {cfg.icon}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-md bg-neutral-800 text-neutral-500 font-mono font-semibold ${
            size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
          }`}
          title={platforms.slice(max).map(p => PLATFORM_CONFIG[p].label).join(', ')}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

/**
 * Multi-select toggle for choosing target platforms.
 */
export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selected, onChange }) => {
  const toggle = (p: Platform) => {
    onChange(
      selected.includes(p)
        ? selected.filter(x => x !== p)
        : [...selected, p]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(
        ([key, cfg]) => {
          const isActive = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              title={cfg.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? 'border-opacity-60 text-white shadow-sm'
                  : 'bg-neutral-950/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
              }`}
              style={
                isActive
                  ? { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}60`, color: cfg.color }
                  : undefined
              }
            >
              <span className="text-sm">{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        }
      )}
    </div>
  );
};
