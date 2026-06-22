import React, { useRef } from 'react';
import {
  Type, Image as ImageIcon, Video, Upload, AlertCircle,
  Maximize2, Minimize2, Move, Pipette, X,
} from 'lucide-react';
import { TemplateField, DesignMD } from '../../types';

/**
 * TemplateFieldInput — Shared form field component for TemplateField.
 *
 * Used in:
 * - ProductionForm (live mode — user fills real data)
 * - FormPreviewPanel (disabled mode — shows form mockup in builder)
 * - TemplateBuilder test-data mode (live — designer fills test data)
 */

export interface TemplateFieldInputProps {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  designMD: DesignMD;
  /** Media fit mode for image/video fields */
  mediaFit?: 'cover' | 'contain' | 'fill';
  /** Callback when user changes the media fit mode */
  onMediaFitChange?: (fit: 'cover' | 'contain' | 'fill') => void;
  /** Background color for contain mode empty space (null = transparent) */
  containBgColor?: string | null;
  /** Callback when user changes the contain background color */
  onContainBgColorChange?: (color: string | null) => void;
  /** When true, all inputs are disabled (form preview mode) */
  disabled?: boolean;
}

export const TemplateFieldInput: React.FC<TemplateFieldInputProps> = ({
  field,
  value,
  onChange,
  error,
  designMD,
  mediaFit,
  onMediaFitChange,
  containBgColor,
  onContainBgColorChange,
  disabled = false,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isText = field.type === 'text';
  const isMedia = field.type === 'image' || field.type === 'video';
  const isVideoField = field.type === 'video';
  const isMultiline = field.rules?.multiline;
  const maxChars = field.rules?.maxChars;

  const resolvedFont = (() => {
    if (field.style?.textRole === 'title') return designMD.titleFont || designMD.baseFont;
    if (field.style?.textRole === 'subtitle') return designMD.subtitleFont || designMD.baseFont;
    return designMD.paragraphFont || designMD.baseFont;
  })();

  const currentFit = mediaFit || 'cover';

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium">
        {isText && <Type size={11} className="text-sky-400" />}
        {isMedia && (isVideoField
          ? <Video size={11} className="text-sky-400" />
          : <ImageIcon size={11} className="text-sky-400" />
        )}
        {field.label}
        {field.required && <span className="text-red-400 text-[10px]">*</span>}
      </label>

      {/* Text input */}
      {isText && (
        isMultiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.content || `Escribe ${field.label.toLowerCase()}...`}
            rows={3}
            maxLength={maxChars || undefined}
            disabled={disabled}
            className={`w-full bg-neutral-800/50 border rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors ${
              disabled ? 'text-neutral-500 cursor-not-allowed' : ''
            } ${
              error ? 'border-red-500/50' : 'border-neutral-700'
            }`}
            style={{ fontFamily: resolvedFont }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.content || `Escribe ${field.label.toLowerCase()}...`}
            maxLength={maxChars || undefined}
            disabled={disabled}
            className={`w-full bg-neutral-800/50 border rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 transition-colors ${
              disabled ? 'text-neutral-500 cursor-not-allowed' : ''
            } ${
              error ? 'border-red-500/50' : 'border-neutral-700'
            }`}
            style={{
              fontFamily: resolvedFont,
              fontWeight: field.style.fontWeight || 400,
            }}
          />
        )
      )}

      {/* Media upload */}
      {isMedia && (
        <label
          className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg transition-colors ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          } ${
            value
              ? 'border-violet-500/30 bg-violet-950/10'
              : error
                ? 'border-red-500/30 bg-red-950/5'
                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
          }`}
        >
          {value ? (
            <div className="relative w-full h-full">
              {isVideoField ? (
                <video
                  src={value}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <img
                  src={value}
                  alt={field.label}
                  className="w-full h-full object-cover rounded-md"
                />
              )}
              {!disabled && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); }}
                  title="Quitar media"
                  className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <>
              <Upload size={18} className="text-neutral-600 mb-1.5" />
              <span className="text-[9px] text-neutral-600">
                {isVideoField ? 'Subir video' : 'Subir imagen'}
              </span>
              {field.rules?.aspectRatio && (
                <span className="text-[8px] text-neutral-700 mt-0.5">
                  Ratio: {field.rules.aspectRatio}
                </span>
              )}
            </>
          )}
          {!disabled && (
            <input
              type="file"
              accept={isVideoField ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onChange(url);
                }
              }}
            />
          )}
        </label>
      )}

      {/* Media Fit Selector — shown when media is uploaded and not disabled */}
      {isMedia && value && !disabled && onMediaFitChange && (
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-neutral-500 mr-1">Ajuste:</span>
          {([
            { key: 'cover' as const, label: 'Cover', icon: <Maximize2 size={9} />, tip: 'Llena el área, recorta bordes' },
            { key: 'contain' as const, label: 'Contain', icon: <Minimize2 size={9} />, tip: 'Muestra completo, puede tener vacíos' },
            { key: 'fill' as const, label: 'Fill', icon: <Move size={9} />, tip: 'Estira para llenar (puede distorsionar)' },
          ]).map(opt => (
            <button
              key={opt.key}
              type="button"
              title={opt.tip}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMediaFitChange(opt.key); }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium border transition-all ${
                currentFit === opt.key
                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Contain Background Color Picker — shown when fit=contain, media uploaded, not disabled */}
      {isMedia && value && !disabled && currentFit === 'contain' && onContainBgColorChange && (
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-neutral-500">Fondo:</span>
          {/* Color swatch — click opens native picker */}
          <button
            type="button"
            title={containBgColor ? `Color: ${containBgColor}` : 'Seleccionar color de fondo'}
            onClick={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
            className="w-5 h-5 rounded border border-neutral-700 hover:border-neutral-500 transition-colors overflow-hidden flex items-center justify-center shrink-0"
            style={{
              backgroundColor: containBgColor || undefined,
              // Checkerboard pattern for transparent
              ...(!containBgColor ? {
                backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              } : {}),
            }}
          >
            {!containBgColor && <Pipette size={8} className="text-neutral-400" />}
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={containBgColor || '#000000'}
            onChange={(e) => onContainBgColorChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
          {/* Transparent toggle */}
          <button
            type="button"
            title="Fondo transparente"
            onClick={(e) => { e.preventDefault(); onContainBgColorChange(null); }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium border transition-all ${
              !containBgColor
                ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <X size={7} />
            Transparente
          </button>
          {/* Quick color — show clear button when color is set */}
          {containBgColor && (
            <span className="text-[7px] text-neutral-600 font-mono">{containBgColor}</span>
          )}
        </div>
      )}

      {/* Error / validation hints */}
      {error && (
        <p className="text-[9px] text-red-400 flex items-center gap-1">
          <AlertCircle size={9} /> {error}
        </p>
      )}
      {!error && maxChars && isText && (
        <p className="text-[8px] text-neutral-600 flex items-center gap-1">
          <AlertCircle size={8} /> Máximo {maxChars} caracteres
          {value && <span className="ml-auto">{value.length}/{maxChars}</span>}
        </p>
      )}
    </div>
  );
};
