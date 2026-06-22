import React from 'react';
import { Type } from 'lucide-react';
import { DesignMD } from '../../types';
import { FontPicker } from '../ui/FontPicker';

interface BrandTabTypographyProps {
  designMD: DesignMD;
  handleDesignChange: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
}

export const BrandTabTypography: React.FC<BrandTabTypographyProps> = ({ designMD, handleDesignChange }) => {
  return (
    <div className="space-y-6">
      {/* Sistema Tipográfico Jerárquico */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase flex items-center gap-2"><Type size={16} /> Sistema Tipográfico</h3>

        {/* Fuente Base */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-neutral-400">Fuente Base</label>
          <p className="text-[10px] text-neutral-500 -mt-1">Se usa como fallback cuando un rol tipográfico no tiene fuente asignada</p>
          <FontPicker
            value={designMD.baseFont}
            onChange={(font) => handleDesignChange('baseFont', font)}
          />
        </div>
        
        {/* Títulos */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-neutral-400">Estilo para Títulos</label>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
            <FontPicker
              value={designMD.titleFont || designMD.baseFont}
              onChange={(font) => handleDesignChange('titleFont', font)}
              brandFont={designMD.baseFont}
            />
            <input
              type="number"
              value={designMD.titleSize || 64}
              onChange={(e) => handleDesignChange('titleSize', Number(e.target.value))}
              className="bg-neutral-900 text-sm rounded-lg px-3 py-2 border border-neutral-800 outline-none font-mono text-white"
              placeholder="Size"
            />
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-2">
              <input
                type="color"
                value={designMD.titleColor || designMD.textColor}
                onChange={(e) => handleDesignChange('titleColor', e.target.value)}
                className="w-6 h-6 rounded bg-neutral-800 border-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Subtítulos */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-neutral-400">Estilo para Subtítulos</label>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
            <FontPicker
              value={designMD.subtitleFont || designMD.baseFont}
              onChange={(font) => handleDesignChange('subtitleFont', font)}
              brandFont={designMD.baseFont}
            />
            <input
              type="number"
              value={designMD.subtitleSize || 32}
              onChange={(e) => handleDesignChange('subtitleSize', Number(e.target.value))}
              className="bg-neutral-900 text-sm rounded-lg px-3 py-2 border border-neutral-800 outline-none font-mono text-white"
              placeholder="Size"
            />
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-2">
              <input
                type="color"
                value={designMD.subtitleColor || designMD.textColor}
                onChange={(e) => handleDesignChange('subtitleColor', e.target.value)}
                className="w-6 h-6 rounded bg-neutral-800 border-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Párrafos */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-neutral-400">Estilo para Párrafos</label>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
            <FontPicker
              value={designMD.paragraphFont || designMD.baseFont}
              onChange={(font) => handleDesignChange('paragraphFont', font)}
              brandFont={designMD.baseFont}
            />
            <input
              type="number"
              value={designMD.paragraphSize || 16}
              onChange={(e) => handleDesignChange('paragraphSize', Number(e.target.value))}
              className="bg-neutral-900 text-sm rounded-lg px-3 py-2 border border-neutral-800 outline-none font-mono text-white"
              placeholder="Size"
            />
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-2">
              <input
                type="color"
                value={designMD.paragraphColor || designMD.textColor}
                onChange={(e) => handleDesignChange('paragraphColor', e.target.value)}
                className="w-6 h-6 rounded bg-neutral-800 border-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
