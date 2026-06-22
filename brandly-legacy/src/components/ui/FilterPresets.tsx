import React from 'react';
import { TimelineElement } from '../../types';

interface FilterPresetsProps {
  element: TimelineElement;
  onUpdate: (updates: Partial<TimelineElement>) => void;
}

const FILTER_PRESETS = [
  { name: 'Original', brightness: 100, contrast: 100, saturation: 100 },
  { name: 'Vivid', brightness: 105, contrast: 115, saturation: 140 },
  { name: 'Moody', brightness: 90, contrast: 120, saturation: 70 },
  { name: 'Warm', brightness: 105, contrast: 105, saturation: 120 },
  { name: 'Cool', brightness: 100, contrast: 110, saturation: 80 },
  { name: 'Film', brightness: 95, contrast: 130, saturation: 85 },
  { name: 'B&W', brightness: 100, contrast: 110, saturation: 0 },
  { name: 'Retro', brightness: 110, contrast: 90, saturation: 130 },
  { name: 'Dramatic', brightness: 85, contrast: 150, saturation: 90 },
  { name: 'Soft', brightness: 110, contrast: 85, saturation: 90 },
  { name: 'Muted', brightness: 100, contrast: 95, saturation: 50 },
  { name: 'Neon', brightness: 110, contrast: 130, saturation: 180 },
];

/**
 * FilterPresets — Quick-apply color filter presets to images/videos.
 * Each preset adjusts brightness, contrast, and saturation.
 */
export const FilterPresets: React.FC<FilterPresetsProps> = ({ element, onUpdate }) => {
  const currentKey = `${element.brightness ?? 100}-${element.contrast ?? 100}-${element.saturation ?? 100}`;

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Filtros Rápidos</span>
      <div className="grid grid-cols-4 gap-1">
        {FILTER_PRESETS.map((preset) => {
          const presetKey = `${preset.brightness}-${preset.contrast}-${preset.saturation}`;
          const isActive = currentKey === presetKey;

          return (
            <button
              key={preset.name}
              onClick={() => onUpdate({
                brightness: preset.brightness,
                contrast: preset.contrast,
                saturation: preset.saturation,
              })}
              title={`Filtro: ${preset.name}`}
              className={`py-1.5 px-1 rounded-lg text-[8px] font-medium transition-all border ${
                isActive
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
