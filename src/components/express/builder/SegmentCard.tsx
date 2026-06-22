import React from 'react';
import { X, Zap, FileText, Clock, AlertTriangle, Film } from 'lucide-react';
import { ExpressScene, DesignMD, CompanyProfile } from '../../../types';

interface SegmentCardProps {
  scene: ExpressScene;
  position: 'before' | 'after';
  designMD: DesignMD;
  previewBrand: CompanyProfile | null;
  onSourceChange: (source: 'brand' | 'form') => void;
  onDurationChange: (seconds: number) => void;
  onLabelChange: (label: string) => void;
  onRequiredChange: (required: boolean) => void;
  onTransitionChange: (type: string) => void;
  onRemove: () => void;
}

const TRANSITION_OPTIONS = [
  { value: 'none', label: 'Sin transición' },
  { value: 'fade', label: 'Fundido' },
  { value: 'slideUp', label: 'Deslizar ↑' },
  { value: 'slideDown', label: 'Deslizar ↓' },
  { value: 'slideLeft', label: 'Deslizar ←' },
  { value: 'slideRight', label: 'Deslizar →' },
  { value: 'scale', label: 'Escala' },
];

/**
 * SegmentCard — Visual card for an intro/outro segment in the SceneComposer.
 * 
 * Shows a source toggle (Marca/Formulario), duration, badge, and description.
 * Matches the boceto design with dashed borders and pill-style toggles.
 */
export const SegmentCard: React.FC<SegmentCardProps> = ({
  scene,
  position,
  designMD,
  previewBrand,
  onSourceChange,
  onDurationChange,
  onLabelChange,
  onRequiredChange,
  onTransitionChange,
  onRemove,
}) => {
  const isIntro = position === 'before';
  const isBrand = scene.segmentSource === 'brand';

  // Check if brand has the required video
  const brandVideoUrl = isIntro ? designMD.introVideoUrl : designMD.outroVideoUrl;
  const hasBrandVideo = !!brandVideoUrl;
  const brandMissing = isBrand && !hasBrandVideo;

  const borderColor = isBrand ? '#8b5cf6' : '#3b82f6';
  const badgeBg = isBrand ? 'bg-violet-500/15' : 'bg-sky-500/15';
  const badgeText = isBrand ? 'text-violet-300' : 'text-sky-300';
  const badgeBorder = isBrand ? 'border-violet-500/30' : 'border-sky-500/30';

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all group"
      style={{
        border: `1.5px ${isBrand ? 'solid' : 'dashed'} ${borderColor}40`,
        backgroundColor: `${borderColor}08`,
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      {/* Header: title + duration + remove */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[9px] font-bold text-white/80 tracking-wider uppercase">
          {isIntro ? 'Antes' : 'Después'}
        </span>
        <div className="flex items-center gap-1.5">
          {/* Duration */}
          <div className="flex items-center gap-0.5" title="Duración del segmento">
            <Clock size={8} className="text-neutral-500" />
            <input
              type="number"
              value={scene.durationSeconds}
              onChange={(e) => onDurationChange(Math.max(1, Number(e.target.value)))}
              title="Duración en segundos"
              className="w-8 bg-transparent text-[9px] font-mono text-neutral-400 text-right border-none outline-none"
              step={0.5}
              min={1}
              max={30}
            />
            <span className="text-[8px] text-neutral-600">s</span>
          </div>
          {/* Remove */}
          <button
            onClick={onRemove}
            title={`Eliminar ${isIntro ? 'intro' : 'outro'}`}
            className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={8} />
          </button>
        </div>
      </div>

      {/* Source toggle */}
      <div className="px-3 pb-2">
        <div className="flex items-center bg-neutral-800/60 rounded-lg border border-neutral-700/40 p-0.5">
          <button
            onClick={() => onSourceChange('brand')}
            title="Usar video de intro/outro de la marca (automático)"
            className={`flex-1 px-2 py-1 rounded-md text-[8px] font-semibold transition-all ${
              isBrand
                ? 'bg-violet-600/30 text-violet-200 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Marca
          </button>
          <button
            onClick={() => onSourceChange('form')}
            title="Pedir al productor que suba el video en el formulario"
            className={`flex-1 px-2 py-1 rounded-md text-[8px] font-semibold transition-all ${
              !isBrand
                ? 'bg-sky-600/30 text-sky-200 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Formulario
          </button>
        </div>
      </div>

      {/* Badge */}
      <div className="px-3 pb-1.5 flex items-center justify-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${badgeBg} ${badgeText} ${badgeBorder}`}>
          {isBrand ? (
            <><Zap size={7} /> Auto</>
          ) : (
            <><FileText size={7} /> Campo</>
          )}
        </span>
      </div>

      {/* Description */}
      <div className="px-3 pb-3 text-center">
        {isBrand ? (
          <>
            <p className="text-[9px] text-white/70 font-medium">
              {isIntro ? 'Intro de la marca' : 'Outro de la marca'}
            </p>
            <p className="text-[8px] text-neutral-500 mt-0.5">
              {previewBrand
                ? (hasBrandVideo ? 'desde el Design MD' : '')
                : 'desde el Design MD'}
            </p>
            {brandMissing && previewBrand && (
              <div className="flex items-center gap-1 justify-center mt-1.5 text-amber-400">
                <AlertTriangle size={8} />
                <span className="text-[7px] font-medium">
                  {previewBrand.name} no tiene {isIntro ? 'intro' : 'outro'}
                </span>
              </div>
            )}
            {hasBrandVideo && previewBrand && (
              <div className="mt-1.5 rounded-md overflow-hidden border border-neutral-700/30" style={{ height: 36 }}>
                <video
                  src={brandVideoUrl}
                  muted
                  className="w-full h-full object-cover"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-[9px] text-white/70 font-medium">
              {scene.segmentFieldLabel || (isIntro ? 'Video de intro' : 'Video de cierre')}
            </p>
            <p className="text-[8px] text-neutral-500 mt-0.5">
              el productor lo sube
            </p>
            {/* Label config */}
            <input
              type="text"
              value={scene.segmentFieldLabel || ''}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Etiqueta del campo"
              title="Nombre del campo en el formulario"
              className="mt-1.5 w-full bg-neutral-800/50 border border-neutral-700/40 rounded-md px-2 py-1 text-[8px] text-white placeholder-neutral-600 outline-none focus:border-sky-500/40"
            />
            <label className="flex items-center gap-1 justify-center mt-1 cursor-pointer" title="¿Es obligatorio subir este video?">
              <input
                type="checkbox"
                checked={scene.segmentFieldRequired ?? true}
                onChange={(e) => onRequiredChange(e.target.checked)}
                className="w-3 h-3 rounded bg-neutral-800 border-neutral-700 accent-sky-500"
              />
              <span className="text-[7px] text-neutral-500">Obligatorio</span>
            </label>
          </>
        )}
      </div>

      {/* Transition selector */}
      <div className="px-3 pb-2.5 border-t border-neutral-800/40 pt-2">
        <div className="flex items-center gap-1">
          <Film size={7} className="text-neutral-500 shrink-0" />
          <select
            value={scene.segmentTransition?.type || 'fade'}
            onChange={(e) => onTransitionChange(e.target.value)}
            title="Transición del segmento"
            className="flex-1 bg-transparent text-[8px] text-neutral-400 border-none outline-none cursor-pointer"
          >
            {TRANSITION_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Position summary */}
      {(scene.segmentVideoX != null || scene.segmentVideoW != null) && (
        <div className="px-3 pb-2 flex items-center justify-center gap-1 text-[7px] text-emerald-400/60 font-mono">
          <span>📐</span>
          <span>
            {(scene.segmentVideoX ?? 50).toFixed(0)},{(scene.segmentVideoY ?? 50).toFixed(0)}
          </span>
          <span>—</span>
          <span>
            {(scene.segmentVideoW ?? 100).toFixed(0)}×{(scene.segmentVideoH ?? 100).toFixed(0)}
          </span>
          {scene.segmentVideoFit && scene.segmentVideoFit !== 'cover' && (
            <span className="text-emerald-400/40">({scene.segmentVideoFit})</span>
          )}
        </div>
      )}
    </div>
  );
};
