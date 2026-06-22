import React from 'react';
import { Smartphone, Monitor, Tablet } from 'lucide-react';

interface ResponsivePreviewProps {
  mode: 'desktop' | 'tablet' | 'phone' | null;
  onModeChange: (mode: 'desktop' | 'tablet' | 'phone' | null) => void;
}

const PREVIEW_MODES = [
  { value: null as null, label: 'Normal', icon: Monitor, scale: 1 },
  { value: 'tablet' as const, label: 'Tablet', icon: Tablet, scale: 0.65 },
  { value: 'phone' as const, label: 'Phone', icon: Smartphone, scale: 0.45 },
];

/**
 * ResponsivePreviewToggle — Toggles canvas preview between desktop, tablet, and phone sizes.
 * Shows a device frame indicator around the canvas preview.
 */
export const ResponsivePreviewToggle: React.FC<ResponsivePreviewProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className="flex items-center gap-0.5 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/40 rounded-lg p-0.5">
      {PREVIEW_MODES.map(preset => {
        const Icon = preset.icon;
        const isActive = mode === preset.value;
        return (
          <button
            key={preset.label}
            onClick={() => onModeChange(isActive ? null : preset.value)}
            title={`Preview: ${preset.label}`}
            className={`p-1 rounded-md transition-all ${
              isActive
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
};

/**
 * Returns the scale factor for a given responsive preview mode.
 */
export function getPreviewScale(mode: 'desktop' | 'tablet' | 'phone' | null): number {
  switch (mode) {
    case 'tablet': return 0.65;
    case 'phone': return 0.45;
    default: return 1;
  }
}
