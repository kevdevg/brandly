import React from 'react';
import { Palette, Eye, EyeOff } from 'lucide-react';
import { DesignMD } from '../../types';

interface ExpressStylePanelProps {
  designMD: DesignMD;
  bgStyle: 'solid' | 'gradient' | 'dark';
  setBgStyle: (style: 'solid' | 'gradient' | 'dark') => void;
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  overlayOpacity: number;
  setOverlayOpacity: (opacity: number) => void;
}

/**
 * ExpressStylePanel — Brand-constrained style controls.
 * Only allows changes within the brand palette — no custom colors.
 */
export const ExpressStylePanel: React.FC<ExpressStylePanelProps> = ({
  designMD,
  bgStyle,
  setBgStyle,
  showLogo,
  setShowLogo,
  overlayOpacity,
  setOverlayOpacity,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Palette size={10} className="text-neutral-500" />
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Estilo</span>
      </div>

      {/* Brand colors (read-only) */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-neutral-500">Paleta:</span>
        {[designMD.primaryColor, designMD.secondaryColor, designMD.textColor].map((c, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-md border border-neutral-700 shadow-sm"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <span className="text-[7px] text-neutral-600 ml-auto font-mono">{designMD.baseFont.split(',')[0].replace(/"/g, '')}</span>
      </div>

      {/* Background style */}
      <div className="space-y-1">
        <span className="text-[9px] text-neutral-500">Fondo</span>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: 'solid' as const, label: 'Sólido', preview: designMD.secondaryColor },
            { value: 'gradient' as const, label: 'Degradado', preview: `linear-gradient(135deg, ${designMD.primaryColor}, ${designMD.secondaryColor})` },
            { value: 'dark' as const, label: 'Oscuro', preview: '#111111' },
          ]).map(bg => (
            <button
              key={bg.value}
              onClick={() => setBgStyle(bg.value)}
              title={bg.label}
              className={`relative h-8 rounded-lg border overflow-hidden transition-all ${
                bgStyle === bg.value
                  ? 'border-violet-500/60 ring-1 ring-violet-500/20'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div
                className="absolute inset-0"
                style={{ background: bg.preview }}
              />
              <span className="relative text-[8px] font-semibold text-white drop-shadow-md">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overlay opacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-neutral-500">Overlay</span>
          <span className="text-[8px] text-neutral-600 font-mono">{overlayOpacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={80}
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          title="Opacidad del overlay oscuro"
        />
      </div>

      {/* Logo toggle */}
      <button
        onClick={() => setShowLogo(!showLogo)}
        title={showLogo ? 'Ocultar logo' : 'Mostrar logo'}
        className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg border transition-all ${
          showLogo
            ? 'bg-violet-600/10 border-violet-500/30 text-violet-300'
            : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
        }`}
      >
        <span className="text-[9px] font-medium">Logo de marca</span>
        {showLogo ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
    </div>
  );
};
