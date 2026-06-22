import React, { useState } from 'react';
import { LayoutTemplate, Menu, Home, Settings, Download, ZoomIn, ZoomOut, X, CalendarDays, Sparkles, Play } from 'lucide-react';

interface TopHeaderProps {
  currentStep: 'dashboard' | 'brand' | 'studio' | 'express' | 'content-grid' | 'template-builder' | 'production-form';
  setCurrentStep: (step: 'dashboard' | 'brand' | 'studio' | 'express' | 'content-grid' | 'template-builder' | 'production-form') => void;
  /** Open Express editor with blank canvas, no brand */
  onStartExpressBlank?: () => void;
  /** Open Pro editor with blank canvas, no brand */
  onStartProBlank?: () => void;
  outputFormat?: 'video' | 'image';
  /** Zoom controls — passed up from StudioWorkspace */
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  /** Aspect ratio controls */
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:5' | '4:3';
  onAspectRatioChange?: (ratio: '16:9' | '1:1' | '9:16' | '4:5' | '4:3') => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentStep,
  setCurrentStep,
  outputFormat,
  onStartExpressBlank,
  onStartProBlank,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  aspectRatio = '9:16',
  onAspectRatioChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isStudio = currentStep === 'studio';

  return (
    <header className="flex-none border-b border-neutral-800/60 bg-neutral-900/95 backdrop-blur-sm px-3 h-11 flex items-center justify-between z-30 relative">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menú principal"
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Menu size={16} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-52 bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl z-50 py-1 animate-in">
                <button
                  onClick={() => { setCurrentStep('dashboard'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  <Home size={14} /> Ir al Dashboard
                </button>
                {currentStep !== 'brand' && (
                  <button
                    onClick={() => { setCurrentStep('brand'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                  >
                    <Settings size={14} /> Editar Marca
                  </button>
                )}
                <button
                  onClick={() => { setCurrentStep('content-grid'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  <CalendarDays size={14} /> Malla de Contenidos
                </button>
                <div className="h-px bg-neutral-700 my-1" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  <Download size={14} /> Descargar
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-violet-600/20 p-1 rounded text-violet-400">
            <LayoutTemplate size={14} />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">SaaS Branding</span>
        </div>
      </div>

      {/* Center: Zoom controls (only in studio) */}
      {isStudio && onZoomIn && onZoomOut && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onZoomOut(); }}
            title="Zoom Out"
            className="p-1 text-neutral-500 hover:text-white rounded transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onZoomReset?.(); }}
            title="Restablecer zoom"
            className="text-[11px] font-mono text-neutral-400 hover:text-white w-12 text-center rounded py-0.5 hover:bg-neutral-800 transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onZoomIn(); }}
            title="Zoom In"
            className="p-1 text-neutral-500 hover:text-white rounded transition-colors"
          >
            <ZoomIn size={14} />
          </button>

          {/* Aspect ratio pills */}
          {onAspectRatioChange && (
            <>
              <div className="w-px h-4 bg-neutral-700 mx-1" />
              {(['16:9', '9:16', '1:1', '4:5', '4:3'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={(e) => { e.stopPropagation(); onAspectRatioChange(ratio); }}
                  title={`Formato ${ratio}`}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-neutral-700 text-white'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Right: Editor buttons + Format badge */}
      <div className="flex items-center gap-2">
        {/* Express / Pro buttons — only on dashboard */}
        {currentStep === 'dashboard' && onStartExpressBlank && (
          <button
            onClick={onStartExpressBlank}
            title="Crear desde cero con el editor rápido (sin marca)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[10px] font-bold transition-all shadow-sm hover:shadow-md"
          >
            <Sparkles size={12} />
            Express ⚡
          </button>
        )}
        {currentStep === 'dashboard' && onStartProBlank && (
          <button
            onClick={onStartProBlank}
            title="Crear desde cero con el editor profesional (sin marca)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-[10px] font-semibold transition-all"
          >
            <Play size={12} />
            Editor Pro 🎛️
          </button>
        )}

        {isStudio && (
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            {outputFormat === 'image' ? 'Imagen' : 'Video'}
          </span>
        )}
        {currentStep !== 'dashboard' && !isStudio && (
          <button
            onClick={() => setCurrentStep('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs font-medium transition-all"
          >
            Dashboard
          </button>
        )}
      </div>
    </header>
  );
};
