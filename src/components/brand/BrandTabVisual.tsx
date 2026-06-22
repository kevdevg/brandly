import React, { useCallback } from 'react';
import { Settings2, ImageIcon } from 'lucide-react';
import { DesignMD } from '../../types';
import { FileDropZone } from '../ui/FileDropZone';

interface BrandTabVisualProps {
  designMD: DesignMD;
  handleDesignChange: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
}

export const BrandTabVisual: React.FC<BrandTabVisualProps> = ({
  designMD,
  handleDesignChange,
}) => {
  const handleLogoFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleDesignChange('logoUrl', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [handleDesignChange]);

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">Identidad Visual</h3>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Logo Corporativo</label>
        
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center p-3 shrink-0 border border-neutral-700 shadow-lg">
            {designMD.logoUrl ? (
              <img src={designMD.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <ImageIcon size={32} className="text-neutral-300" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={designMD.logoUrl}
              onChange={(e) => handleDesignChange('logoUrl', e.target.value)}
              className="bg-neutral-900 text-sm rounded-lg px-4 py-2.5 w-full border border-neutral-800 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono text-white"
              placeholder="https://logo.svg"
            />
            <FileDropZone
              compact
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              label="Subir desde archivo"
              onFiles={handleLogoFiles}
            />
          </div>
        </div>
      </div>

      {/* Colors Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <label className="block text-xs font-medium text-neutral-400 mb-3">Color Primario (Marco)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={designMD.primaryColor}
              onChange={(e) => handleDesignChange('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg shrink-0 bg-neutral-800 border-none cursor-pointer"
            />
            <input
              type="text"
              value={designMD.primaryColor}
              onChange={(e) => handleDesignChange('primaryColor', e.target.value)}
              className="bg-neutral-950 text-sm rounded uppercase px-3 py-2 w-full border border-neutral-800 outline-none font-mono text-neutral-300"
            />
          </div>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <label className="block text-xs font-medium text-neutral-400 mb-3">Color Secundario (Fondo)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={designMD.secondaryColor}
              onChange={(e) => handleDesignChange('secondaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg shrink-0 bg-neutral-800 border-none cursor-pointer"
            />
            <input
              type="text"
              value={designMD.secondaryColor}
              onChange={(e) => handleDesignChange('secondaryColor', e.target.value)}
              className="bg-neutral-950 text-sm rounded uppercase px-3 py-2 w-full border border-neutral-800 outline-none font-mono text-neutral-300"
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <label className="block text-xs font-medium text-neutral-400 mb-3">Color de Texto Base</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={designMD.textColor}
              onChange={(e) => handleDesignChange('textColor', e.target.value)}
              className="w-10 h-10 rounded-lg shrink-0 bg-neutral-800 border-none cursor-pointer"
            />
            <input
              type="text"
              value={designMD.textColor}
              onChange={(e) => handleDesignChange('textColor', e.target.value)}
              className="bg-neutral-950 text-sm rounded uppercase px-3 py-2 w-full border border-neutral-800 outline-none font-mono text-neutral-300"
            />
          </div>
        </div>
      </div>

      {/* Frame Thickness */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
         <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase flex items-center gap-2"><Settings2 size={16} /> Configuración Base</h3>
        <div>
          <label className="flex justify-between text-sm font-medium text-neutral-300 mb-4">
            <span>Espesor del Marco Perimetral</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded text-violet-300 text-xs font-mono">{designMD.frameThickness}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="80"
            value={designMD.frameThickness}
            onChange={(e) => handleDesignChange('frameThickness', parseInt(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>
      </div>
    </div>
  );
};
