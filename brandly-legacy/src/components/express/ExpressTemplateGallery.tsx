import React, { useState, useMemo } from 'react';
import { Sparkles, Filter, Video, Image as ImageIcon } from 'lucide-react';
import { ExpressTemplate, DesignMD } from '../../types';
import { EXPRESS_TEMPLATES } from '../../config/expressTemplates';
import { getTemplateDuration } from '../../utils/expressCompiler';

interface ExpressTemplateGalleryProps {
  designMD: DesignMD;
  onSelectTemplate: (template: ExpressTemplate) => void;
  customTemplates?: ExpressTemplate[];
  brandTemplates?: ExpressTemplate[];
  brandName?: string;
}

type CategoryFilter = 'all' | ExpressTemplate['category'];
type FormatFilter = 'all' | 'video' | 'image';

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: 'Todos', icon: '✨' },
  social: { label: 'Social', icon: '📱' },
  ad: { label: 'Publicidad', icon: '🎯' },
  promo: { label: 'Promo', icon: '🚀' },
  story: { label: 'Historia', icon: '💬' },
  announcement: { label: 'Anuncio', icon: '📢' },
};

/**
 * ExpressTemplateGallery — Grid of Express templates with category/format filters.
 * Shows previews using brand colors and allows template selection.
 */
export const ExpressTemplateGallery: React.FC<ExpressTemplateGalleryProps> = ({
  designMD,
  onSelectTemplate,
  customTemplates = [],
  brandTemplates = [],
  brandName,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');

  const allTemplates = useMemo(() => [
    ...EXPRESS_TEMPLATES,
    ...customTemplates,
  ], [customTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter(t => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (formatFilter !== 'all' && t.format !== formatFilter) return false;
      return true;
    });
  }, [allTemplates, categoryFilter, formatFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20">
          <Sparkles size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Elige una Plantilla</h2>
          <p className="text-xs text-neutral-500">
            Se aplicarán los colores y fuentes de <span className="text-violet-400">{designMD.brandName || 'tu marca'}</span> automáticamente
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Format toggle */}
        <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 shrink-0">
          {(['all', 'video', 'image'] as FormatFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              title={f === 'all' ? 'Todos los formatos' : f === 'video' ? 'Solo video' : 'Solo imagen'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                formatFilter === f
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
              }`}
            >
              {f === 'all' && <Filter size={10} />}
              {f === 'video' && <Video size={10} />}
              {f === 'image' && <ImageIcon size={10} />}
              {f === 'all' ? 'Todo' : f === 'video' ? 'Video' : 'Imagen'}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-1 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key as CategoryFilter)}
              title={`Filtrar por: ${label}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all border ${
                categoryFilter === key
                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Templates Section */}
      {brandTemplates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-amber-300">
              🏷️ Plantillas de {brandName || 'tu marca'}
            </h3>
            <span className="text-[8px] text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              {brandTemplates.length}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {brandTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                title={template.description}
                className="group relative bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
              >
                <div
                  className="h-32 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${designMD.secondaryColor}40 0%, ${designMD.primaryColor}20 100%)`,
                  }}
                >
                  <span className="text-3xl opacity-60 group-hover:opacity-100 transition-all">{template.icon}</span>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-[8px] text-amber-300 font-bold">
                    🏷️ {brandName}
                  </div>
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-semibold backdrop-blur-sm ${
                    template.format === 'video' ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    {template.format === 'video' ? '🎬' : '🖼️'} {template.aspectRatio}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{template.name}</h4>
                  <p className="text-[9px] text-neutral-500 mt-0.5 line-clamp-1">{template.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* General Templates */}
      {brandTemplates.length > 0 && (
        <h3 className="text-xs font-bold text-neutral-400">Plantillas Generales</h3>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            title={template.description}
            className="group relative bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
          >
            {/* Preview area — branded colors */}
            <div
              className="h-40 relative flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${designMD.secondaryColor}40 0%, ${designMD.primaryColor}20 100%)`,
              }}
            >
              {/* Template icon */}
              <span className="text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">
                {template.icon}
              </span>

              {/* Aspect ratio badge */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[8px] text-neutral-300 font-mono">
                {template.aspectRatio}
              </div>

              {/* Format badge */}
              <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-semibold backdrop-blur-sm ${
                template.format === 'video'
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}>
                {template.format === 'video' ? '🎬 Video' : '🖼️ Imagen'}
              </div>

              {/* Duration badge */}
              {template.format === 'video' && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[8px] text-neutral-300 font-mono">
                  {getTemplateDuration(template)}s
                </div>
              )}

              {/* Custom badge */}
              {template.isCustom && (
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[7px] font-bold uppercase tracking-wider">
                  Custom
                </div>
              )}

              {/* Brand color dots */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {!template.isCustom && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: designMD.primaryColor }} />
                    <div className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: designMD.secondaryColor }} />
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">{template.name}</h3>
              <p className="text-[9px] text-neutral-500 mt-0.5 line-clamp-1">{template.description}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {template.scenes.map(scene => (
                  <span
                    key={scene.id}
                    className={`text-[7px] px-1 py-0.5 rounded uppercase tracking-wider ${
                      scene.type === 'intro' || scene.type === 'outro'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {scene.name}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-neutral-600">
          <Filter size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay plantillas para estos filtros</p>
        </div>
      )}
    </div>
  );
};
