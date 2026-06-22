import React, { useState, useMemo } from 'react';
import { Type, Image as ImageIcon, Trash2, Wand2, Loader2, Lock, Maximize, Layers, ChevronDown, ChevronRight, Check, Sparkles, ArrowUp, ArrowDown, ArrowRight, ZoomIn, Disc3, Pipette, Copy, Eye, EyeOff, Clipboard, ClipboardPaste, FlipHorizontal } from 'lucide-react';
import { TimelineElement, DesignMD } from '../../types';
import { updateElementAtIndex, updateElementKeyframes, updateElementTransition } from '../../utils/updateElement';
import { uploadMedia } from '../../utils/mediaUploader';
import { CHROMA_KEY_PRESETS } from '../../utils/chromaKeyUtils';
import { FileDropZone } from '../ui/FileDropZone';
import { ColorPaletteExtractor } from '../ui/ColorPaletteExtractor';
import { FontPicker } from '../ui/FontPicker';
import { AudioElementProperties } from './AudioElementProperties';
import { AnimatedTextPresets } from '../text/AnimatedTextPresets';
import { FilterPresets } from '../ui/FilterPresets';
import { TextStylePresets } from '../ui/TextStylePresets';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { useColorHistory } from '../../hooks/useColorHistory';

interface ElementPropertiesPanelProps {
  selectedElementId: string;
  setSelectedElementId: (id: string | null) => void;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  timeUnit: 'frames' | 'seconds';
  activeLayerId: string;
  designMD: DesignMD;
  outputFormat?: 'video' | 'image';
}

// ─── Transition Definitions ──────────────────────────────
const TRANSITIONS = [
  { value: 'none', label: 'Corte Rápido', desc: 'Sin transición', icon: '⚡' },
  { value: 'fade', label: 'Fundido', desc: 'Aparece/desaparece suavemente', icon: '🌅' },
  { value: 'slideUp', label: 'Deslizar Arriba', desc: 'Entra desde abajo', icon: '⬆' },
  { value: 'slideDown', label: 'Deslizar Abajo', desc: 'Entra desde arriba', icon: '⬇' },
  { value: 'slideLeft', label: 'Deslizar Izquierda', desc: 'Entra desde la derecha', icon: '⬅' },
  { value: 'slideRight', label: 'Deslizar Derecha', desc: 'Entra desde la izquierda', icon: '➡' },
  { value: 'scale', label: 'Escalar', desc: 'Zoom In / Zoom Out', icon: '🔍' },
  { value: 'bounce', label: 'Rebote', desc: 'Efecto de rebote elástico', icon: '🏀' },
  { value: 'blur', label: 'Desenfoque', desc: 'Aparece con desenfoque', icon: '🌊' },
  { value: 'spin', label: 'Girar', desc: 'Rotación de 360°', icon: '🔄' },
  { value: 'flip', label: 'Voltear', desc: 'Giro 3D horizontal', icon: '🪞' },
] as const;

const TEXT_ONLY_TRANSITIONS = [
  { value: 'typewriter', label: 'Máquina de Escribir', desc: 'Letra por letra', icon: '⌨' },
] as const;

// ─── Section Header ──────────────────────────────
const SectionHeader: React.FC<{ title: string; open: boolean; onToggle: () => void }> = ({ title, open, onToggle }) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
  >
    <span>{title}</span>
    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
  </button>
);

// ─── Transition Picker ──────────────────────────────
const TransitionPicker: React.FC<{
  label: string;
  current: string;
  duration: number;
  isText: boolean;
  onChange: (type: string) => void;
  onDurationChange: (d: number) => void;
}> = ({ label, current, duration, isText, onChange, onDurationChange }) => {
  const [open, setOpen] = useState(false);
  const allTransitions = [...TRANSITIONS, ...(isText ? TEXT_ONLY_TRANSITIONS : [])];
  const selected = allTransitions.find(t => t.value === current) || TRANSITIONS[0];
  const hasTransition = current !== 'none';

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
      
      {/* Selected transition pill */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
          hasTransition
            ? 'bg-violet-600/15 border-violet-500/40 text-violet-300 hover:border-violet-400/60'
            : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
        }`}
      >
        <span className="text-sm">{selected.icon}</span>
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown options */}
      {open && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
          {allTransitions.map(t => (
            <button
              key={t.value}
              onClick={() => { onChange(t.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                current === t.value
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <span className="text-sm w-5 text-center">{t.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{t.label}</div>
                <div className="text-[9px] text-neutral-600">{t.desc}</div>
              </div>
              {current === t.value && <Check size={12} className="text-violet-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Duration slider — only shown when a transition is active */}
      {hasTransition && (
        <div className="pl-1 space-y-1">
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Duración</span>
            <span className="font-mono">{duration}f ({(duration / 30).toFixed(1)}s)</span>
          </div>
          <input 
            type="range" min="5" max="60" step="1"
            value={duration} 
            onChange={(e) => onDurationChange(parseInt(e.target.value))}
            className="w-full accent-violet-500 h-1" 
          />
          <div className="flex gap-1">
            {[
              { frames: 8, label: '0.25s' },
              { frames: 15, label: '0.5s' },
              { frames: 30, label: '1s' },
              { frames: 45, label: '1.5s' },
              { frames: 60, label: '2s' },
            ].map(d => (
              <button
                key={d.frames}
                onClick={() => onDurationChange(d.frames)}
                title={d.label}
                className={`flex-1 py-0.5 rounded text-[7px] font-mono transition-colors border ${
                  duration === d.frames
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Slider Row ──────────────────────────────
const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, suffix = '', onChange }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState('');
  const dragRef = React.useRef<{ startX: number; startVal: number } | null>(null);

  const commitEdit = () => {
    const parsed = parseFloat(editVal);
    if (!isNaN(parsed)) onChange(Math.max(min, Math.min(max, parsed)));
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
        <span>{label}</span>
        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            className="w-14 bg-neutral-900 border border-violet-500 rounded px-1 text-right font-mono text-[10px] text-white outline-none"
          />
        ) : (
          <span
            className="font-mono cursor-ew-resize select-none hover:text-violet-300 transition-colors"
            title="Click para editar · Arrastra para ajustar"
            onPointerDown={(e) => {
              e.preventDefault();
              dragRef.current = { startX: e.clientX, startVal: value };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              const delta = (e.clientX - dragRef.current.startX) / 2;
              const newVal = Math.max(min, Math.min(max, dragRef.current.startVal + delta * step));
              onChange(step < 1 ? Math.round(newVal * 10) / 10 : Math.round(newVal));
            }}
            onPointerUp={(e) => {
              if (dragRef.current && Math.abs(e.clientX - dragRef.current.startX) < 3) {
                setEditVal(String(typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value));
                setIsEditing(true);
              }
              dragRef.current = null;
              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            }}
            onWheel={(e) => {
              e.preventDefault();
              const dir = e.deltaY > 0 ? -1 : 1;
              const mult = e.shiftKey ? 10 : 1;
              onChange(Math.max(min, Math.min(max, value + dir * step * mult)));
            }}
          >
            {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{suffix}
          </span>
        )}
      </div>
      <input 
        type="range" min={min} max={max} step={step}
        value={value} 
        onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full accent-violet-500 h-1" 
      />
    </div>
  );
};

export const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  selectedElementId,
  setSelectedElementId,
  timelineElements,
  setTimelineElements,
  timeUnit,
  activeLayerId,
  designMD,
  outputFormat
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPosition, setShowPosition] = useState(false);
  const [showKeyframes, setShowKeyframes] = useState(false);
  const [showColorAdjust, setShowColorAdjust] = useState(false);
  const [showBorderEffects, setShowBorderEffects] = useState(false);
  const [showShadow, setShowShadow] = useState(false);
  const [showChromaKey, setShowChromaKey] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<Partial<TimelineElement> | null>(null);
  const { recentColors, addColor } = useColorHistory();

  const selectedElementIndex = timelineElements.findIndex(el => el.id === selectedElementId);
  const el = selectedElementIndex !== -1 ? timelineElements[selectedElementIndex] : null;

  if (!el) return null;

  // Delegate audio elements to the dedicated audio panel
  if (el.type === 'audio') {
    return (
      <AudioElementProperties
        element={el}
        elementIndex={selectedElementIndex}
        setTimelineElements={setTimelineElements}
        setSelectedElementId={setSelectedElementId}
        timeUnit={timeUnit}
        activeLayerId={activeLayerId}
        timelineElements={timelineElements}
      />
    );
  }

  const i = selectedElementIndex;

  const update = (updates: Partial<TimelineElement>) => {
    setTimelineElements(prev => updateElementAtIndex(prev, i, updates));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2">
          {el.type === 'text' ? <Type size={14} className="text-violet-400" /> : el.type === 'video' ? <Sparkles size={14} className="text-sky-400" /> : <ImageIcon size={14} className="text-emerald-400" />}
          Propiedades
          {el.isBrandElement && (
            <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Lock size={8} /> Marca
            </span>
          )}
        </h2>
        {!el.isBrandElement && (
          <>
          <button
            onClick={() => {
              setTimelineElements(prev => {
                const idx = prev.findIndex(e => e.id === el.id);
                if (idx < prev.length - 1) {
                  const next = [...prev];
                  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                  return next;
                }
                return prev;
              });
            }}
            title="Traer al frente"
            className="text-neutral-500 hover:text-violet-400 p-1 rounded-md hover:bg-violet-500/10 transition-colors"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => {
              setTimelineElements(prev => {
                const idx = prev.findIndex(e => e.id === el.id);
                if (idx > 0) {
                  const next = [...prev];
                  [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                  return next;
                }
                return prev;
              });
            }}
            title="Enviar al fondo"
            className="text-neutral-500 hover:text-violet-400 p-1 rounded-md hover:bg-violet-500/10 transition-colors"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => update({ isHidden: !el.isHidden })}
            title={el.isHidden ? "Mostrar Elemento" : "Ocultar Elemento"}
            className={`p-1 rounded-md transition-colors ${
              el.isHidden
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-neutral-500 hover:text-sky-400 hover:bg-sky-500/10'
            }`}
          >
            {el.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => update({ isLocked: !el.isLocked })}
            title={el.isLocked ? "Desbloquear Elemento" : "Bloquear Elemento"}
            className={`p-1 rounded-md transition-colors ${
              el.isLocked
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Lock size={14} />
          </button>
          <button
            onClick={() => {
              const { id, content, layerId, startFrame, endFrame, isBrandElement, elementName, ...style } = el;
              setCopiedStyle(style);
            }}
            title="Copiar Estilo"
            className="text-neutral-500 hover:text-sky-400 p-1 rounded-md hover:bg-sky-500/10 transition-colors"
          >
            <Clipboard size={14} />
          </button>
          {copiedStyle && (
            <button
              onClick={() => {
                const { type, ...styleProps } = copiedStyle;
                update(styleProps);
              }}
              title="Pegar Estilo"
              className="text-sky-400 hover:text-sky-300 p-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
            >
              <ClipboardPaste size={14} />
            </button>
          )}
          <button
            onClick={() => {
              const copy = { ...el, id: 'el-' + Date.now(), isBrandElement: false, isLocked: false, x: (el.x ?? 50) + 2, y: (el.y ?? 50) + 2 };
              setTimelineElements(prev => [...prev, copy]);
              setSelectedElementId(copy.id);
            }}
            title="Duplicar Elemento"
            className="text-neutral-500 hover:text-emerald-400 p-1 rounded-md hover:bg-emerald-500/10 transition-colors"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => {
              const mirroredX = 100 - (el.x ?? 50);
              const copy = { ...el, id: 'el-' + Date.now(), isBrandElement: false, isLocked: false, x: mirroredX, flipH: !el.flipH };
              setTimelineElements(prev => [...prev, copy]);
              setSelectedElementId(copy.id);
            }}
            title="Duplicar Espejo (reflejo horizontal)"
            className="text-neutral-500 hover:text-cyan-400 p-1 rounded-md hover:bg-cyan-500/10 transition-colors"
          >
            <FlipHorizontal size={14} />
          </button>
          <button 
            onClick={() => {
              setTimelineElements(prev => prev.filter(e => e.id !== selectedElementId));
              setSelectedElementId(null);
            }}
            title="Eliminar Elemento"
            className="text-neutral-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          </>
        )}
      </div>
      
      {/* Element Info Bar */}
      <div className="px-4 py-1.5 border-b border-neutral-800/30 flex items-center gap-3 text-[9px] text-neutral-500 bg-neutral-900/30">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: el.type === 'text' ? '#a78bfa' : el.type === 'image' ? '#34d399' : el.type === 'video' ? '#f472b6' : el.type === 'audio' ? '#38bdf8' : el.type === 'shape' ? '#fbbf24' : '#9ca3af' }} />
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)}
        </span>
        <span className="font-mono">{((el.endFrame - el.startFrame) / 30).toFixed(1)}s</span>
        <span className="font-mono text-neutral-600">F{el.startFrame}–{el.endFrame}</span>
        {el.isLocked && <span className="text-red-400">🔒</span>}
        {!el.isBrandElement && (
          <div className="ml-auto flex items-center gap-1">
            <input
              type="number"
              value={el.startFrame}
              onChange={(e) => update({ startFrame: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-12 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-[8px] text-neutral-400 font-mono text-center"
              title="Frame inicial"
            />
            <span className="text-neutral-700">—</span>
            <input
              type="number"
              value={el.endFrame}
              onChange={(e) => update({ endFrame: Math.max(el.startFrame + 1, parseInt(e.target.value) || 0) })}
              className="w-12 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-[8px] text-neutral-400 font-mono text-center"
              title="Frame final"
            />
          </div>
        )}
      </div>

      {/* Element Name */}
      {!el.isBrandElement && (
        <div className="px-4 py-1 border-b border-neutral-800/20">
          <input
            type="text"
            value={el.elementName ?? ''}
            onChange={(e) => update({ elementName: e.target.value })}
            placeholder={`${el.type === 'text' ? (el.content?.slice(0, 20) || 'Texto') : el.type.charAt(0).toUpperCase() + el.type.slice(1)}`}
            className="w-full bg-transparent border-0 text-[10px] text-neutral-300 placeholder-neutral-600 focus:outline-none py-0.5"
            title="Nombre del elemento"
          />
        </div>
      )}

      {/* Element Notes (collapsible) */}
      {!el.isBrandElement && (
        <div className="px-4 py-0.5 border-b border-neutral-800/20">
          <details>
            <summary className="text-[8px] text-neutral-600 cursor-pointer hover:text-neutral-400 select-none">
              📝 Notas {el.notes ? `(${el.notes.length})` : ''}
            </summary>
            <textarea
              value={el.notes ?? ''}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Añadir notas sobre este elemento..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded text-[9px] text-neutral-400 placeholder-neutral-700 p-1.5 mt-1 resize-none outline-none focus:border-violet-500/40"
              rows={2}
              title="Notas del elemento"
            />
          </details>
        </div>
      )}

      <div className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1 space-y-5">
        
        {/* ═══ Brand Display Mode Toggle ═══ */}
        {el.isBrandElement && el.type === 'video' && (
          <div>
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Modo de Visualización</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => update({ brandDisplayMode: 'fullscreen' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                  (el.brandDisplayMode ?? 'fullscreen') === 'fullscreen'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
                title="Video ocupa todo el canvas como escena completa"
              >
                <Maximize size={12} /> Completo
              </button>
              <button
                onClick={() => update({ brandDisplayMode: 'overlay' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                  el.brandDisplayMode === 'overlay'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
                title="Video se superpone como transparencia posicionable"
              >
                <Layers size={12} /> Overlay
              </button>
            </div>
          </div>
        )}

        {/* ═══ Background Removal — for ALL video, image, sticker elements ═══ */}
        {(el.type === 'video' || el.type === 'image' || el.type === 'sticker') && (
          <div>
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Fondo del Elemento</label>
            <div className="flex gap-1.5 flex-wrap">
              {/* Normal */}
              <button
                onClick={() => update({ blendMode: 'normal', chromaKeyEnabled: false })}
                title="Sin filtro de fondo"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  !el.chromaKeyEnabled && (el.blendMode || 'normal') === 'normal'
                    ? 'bg-violet-600/20 border-violet-500/60 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                Normal
              </button>
              {/* Quitar Blanco */}
              <button
                onClick={() => update({ blendMode: 'multiply', chromaKeyEnabled: false })}
                title="Elimina fondos blancos (multiply)"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  !el.chromaKeyEnabled && el.blendMode === 'multiply'
                    ? 'bg-sky-600/20 border-sky-500/60 text-sky-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                Blanco
              </button>
              {/* Quitar Negro */}
              <button
                onClick={() => update({ blendMode: 'screen', chromaKeyEnabled: false })}
                title="Elimina fondos negros (screen)"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  !el.chromaKeyEnabled && el.blendMode === 'screen'
                    ? 'bg-rose-600/20 border-rose-500/60 text-rose-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                Negro
              </button>
              {/* Overlay */}
              <button
                onClick={() => update({ blendMode: 'overlay', chromaKeyEnabled: false })}
                title="Contraste alto (overlay)"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  !el.chromaKeyEnabled && el.blendMode === 'overlay'
                    ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                Overlay
              </button>
              {/* Soft Light */}
              <button
                onClick={() => update({ blendMode: 'soft-light', chromaKeyEnabled: false })}
                title="Luz suave (soft-light)"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  !el.chromaKeyEnabled && el.blendMode === 'soft-light'
                    ? 'bg-purple-600/20 border-purple-500/60 text-purple-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                Soft Light
              </button>
              {/* Chroma Key */}
              <button
                onClick={() => {
                  update({ chromaKeyEnabled: true, blendMode: 'normal' });
                  setShowChromaKey(true);
                }}
                title="Chroma Key — elimina cualquier color de fondo"
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-medium transition-all border flex items-center justify-center gap-1 ${
                  el.chromaKeyEnabled
                    ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                <Pipette size={10} /> Chroma
              </button>
            </div>

            {/* ── Chroma Key Controls ── */}
            {el.chromaKeyEnabled && (
              <div className="mt-2 bg-neutral-950/60 border border-emerald-500/20 rounded-lg p-3 space-y-3">
                {/* Color picker + presets */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[10px] text-neutral-400">Color a eliminar</label>
                    <input
                      type="color"
                      value={el.chromaKeyColor || '#ffffff'}
                      onChange={(e) => update({ chromaKeyColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                      title="Seleccionar color exacto"
                    />
                    <span className="text-[9px] font-mono text-neutral-500">{el.chromaKeyColor || '#ffffff'}</span>
                  </div>
                  <div className="flex gap-1">
                    {CHROMA_KEY_PRESETS.map(preset => (
                      <button
                        key={preset.color}
                        onClick={() => update({ chromaKeyColor: preset.color })}
                        title={preset.label}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-medium transition-all border ${
                          (el.chromaKeyColor || '#ffffff') === preset.color
                            ? 'bg-emerald-600/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span className="hidden sm:inline">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tolerance slider */}
                <SliderRow
                  label="Tolerancia"
                  value={el.chromaKeyTolerance ?? 30}
                  min={1}
                  max={100}
                  suffix="%"
                  onChange={(v) => update({ chromaKeyTolerance: v })}
                />

                {/* Softness slider */}
                <SliderRow
                  label="Suavizado"
                  value={el.chromaKeySoftness ?? 10}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => update({ chromaKeySoftness: v })}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ Contenido ═══ */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Contenido</label>
          {el.type === 'text' ? (
            <textarea
              value={el.content}
              onChange={(e) => update({ content: e.target.value })}
              rows={2}
              className="bg-neutral-950 text-xs rounded-lg px-3 py-2 w-full border border-neutral-800 outline-none focus:border-violet-500/50 resize-none font-medium"
              placeholder="Escribe el texto..."
            />
          ) : el.type === 'audio' ? (
            <div className="space-y-2">
              <button
                disabled={isTranscribing}
                onClick={async () => {
                  try {
                    setIsTranscribing(true);
                    const res = await fetch(el.content);
                    const blob = await res.blob();
                    const file = new File([blob], "audio.mp3", { type: el.content.startsWith("data:") ? "audio/mpeg" : blob.type });
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
                    if (!response.ok) throw new Error(await response.text());
                    const data = await response.json();
                    if (data.text) {
                      const newTextEl: TimelineElement = {
                        id: Date.now().toString(),
                        layerId: activeLayerId,
                        type: 'text',
                        content: data.text,
                        startFrame: el.startFrame,
                        endFrame: el.endFrame,
                        x: 20, y: 80,
                        shadowOffset: 3, shadowBlur: 6
                      };
                      setTimelineElements(prev => [...prev, newTextEl]);
                    }
                  } catch (err) {
                    console.error("Error generating subtitles:", err);
                    alert("Error al generar subtítulos.");
                  } finally {
                    setIsTranscribing(false);
                  }
                }}
                title="Generar Subtítulos Automáticos"
                className={`w-full font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs ${isTranscribing ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
              >
                {isTranscribing ? (
                  <><Loader2 size={12} className="animate-spin" /> Transcribiendo...</>
                ) : (
                  <><Wand2 size={12} /> Generar Subtítulos</>
                )}
              </button>
              <p className="text-[9px] text-neutral-600 text-center">Whisper Large V3 (Groq)</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={el.content}
                onChange={(e) => update({ content: e.target.value })}
                className="bg-neutral-950 text-xs rounded-lg px-3 py-2 w-full border border-neutral-800 outline-none focus:border-violet-500/50"
                placeholder="URL del Sticker/Imagen..."
              />
              <FileDropZone
                compact
                accept="image/*"
                label="Subir Imagen"
                onFiles={async (files) => {
                  try {
                    const result = await uploadMedia(files[0]);
                    update({ content: result.url });
                  } catch (err) {
                    console.error('Image upload failed:', err);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* ═══ Volume Control (Video/Audio) ═══ */}
        {(el.type === 'video' || el.type === 'audio') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Volumen</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => update({ volume: (el.volume ?? 1) > 0 ? 0 : 1 })}
                  title={(el.volume ?? 1) > 0 ? "Silenciar" : "Activar sonido"}
                  className={`text-[9px] transition-colors ${(el.volume ?? 1) > 0 ? 'text-neutral-400 hover:text-red-400' : 'text-red-400 hover:text-neutral-300'}`}
                >
                  {(el.volume ?? 1) > 0 ? '🔊' : '🔇'}
                </button>
                <span className="text-[10px] font-mono text-neutral-400">{Math.round((el.volume ?? 1) * 100)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={el.volume ?? 1}
              onChange={(e) => update({ volume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1"
              title="Volumen"
            />
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map(v => (
                <button
                  key={v}
                  onClick={() => update({ volume: v })}
                  title={`${Math.round(v * 100)}%`}
                  className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                    Math.abs((el.volume ?? 1) - v) < 0.05
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {Math.round(v * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Speed Control (Video/Audio) ═══ */}
        {(el.type === 'video' || el.type === 'audio') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Velocidad</label>
              <span className="text-[10px] font-mono text-neutral-400">{(el.playbackRate ?? 1).toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25" max="4" step="0.05"
              value={el.playbackRate ?? 1}
              onChange={(e) => update({ playbackRate: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1"
              title="Velocidad de reproducción"
            />
            <div className="flex gap-1">
              {[0.25, 0.5, 1, 1.5, 2, 4].map((rate) => (
                <button
                  key={rate}
                  onClick={() => update({ playbackRate: rate })}
                  title={`${rate}x`}
                  className={`flex-1 py-1 rounded-md text-[9px] font-medium transition-all border ${
                    (el.playbackRate ?? 1) === rate
                      ? 'bg-sky-600/20 border-sky-500/50 text-sky-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Source Trim (Video/Audio) ═══ */}
        {(el.type === 'video' || el.type === 'audio') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Recorte de Fuente</label>
              {(el.trimStartSec || el.trimEndSec) && (
                <button
                  onClick={() => update({ trimStartSec: undefined, trimEndSec: undefined })}
                  title="Resetear recorte"
                  className="text-[9px] text-neutral-500 hover:text-red-400 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-neutral-500 mb-0.5">Inicio (s)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={el.trimStartSec ?? 0}
                  onChange={(e) => {
                    const v = Math.max(0, parseFloat(e.target.value) || 0);
                    update({ trimStartSec: v > 0 ? v : undefined });
                  }}
                  className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-sky-500/50"
                />
              </div>
              <div>
                <label className="block text-[9px] text-neutral-500 mb-0.5">Fin (s)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={el.trimEndSec ?? ''}
                  placeholder="Auto"
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    update({ trimEndSec: v > 0 ? v : undefined });
                  }}
                  className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-sky-500/50"
                />
              </div>
            </div>
            {/* Quick trim presets */}
            <div className="flex gap-1">
              {[
                { label: '5s', start: 0, end: 5 },
                { label: '10s', start: 0, end: 10 },
                { label: '15s', start: 0, end: 15 },
                { label: '30s', start: 0, end: 30 },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => update({ trimStartSec: preset.start, trimEndSec: preset.end })}
                  title={`Primeros ${preset.label}`}
                  className="flex-1 py-0.5 rounded text-[8px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
                >
                  0-{preset.label}
                </button>
              ))}
            </div>
            {/* Visual trim bar */}
            {(el.trimStartSec || el.trimEndSec) && (
              <div className="relative h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-sky-500/40 to-violet-500/40 rounded-full"
                  style={{
                    left: `${((el.trimStartSec ?? 0) / (el.trimEndSec ?? 30)) * 100}%`,
                    right: '0%',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[7px] text-neutral-300 font-mono">
                  {(el.trimStartSec ?? 0).toFixed(1)}s → {(el.trimEndSec ?? '∞')}s
                </div>
              </div>
            )}
            <p className="text-[8px] text-neutral-600">Define qué sección del archivo fuente se reproduce.</p>
          </div>
        )}

        {/* ═══ Animated Text Presets ═══ */}
        {el.type === 'text' && (
          <AnimatedTextPresets element={el} onApplyPreset={(updates) => update(updates)} />
        )}

        {/* ═══ Text Styles ═══ */}
        {el.type === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Estilos de Texto</label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="checkbox" id="useBranding"
                  checked={el.useBranding !== false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const updates: Partial<TimelineElement> = { useBranding: checked };
                    if (checked && designMD) {
                      updates.color = designMD.textColor;
                      updates.fontFamily = designMD.baseFont;
                    }
                    update(updates);
                  }}
                  className="accent-violet-500 w-3 h-3"
                />
                <label htmlFor="useBranding" className="text-[10px] text-neutral-400 cursor-pointer">Branding</label>
              </div>
            </div>
            
            <div className={`bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-3 text-xs ${el.useBranding !== false ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <span className="text-[10px] text-neutral-500 mb-0.5 block">Color</span>
                <input 
                  type="color"
                  value={el.useBranding !== false && designMD ? designMD.textColor : el.color || '#ffffff'} 
                  onChange={(e) => { update({ color: e.target.value, textGradient: undefined }); addColor(e.target.value); }}
                  disabled={el.useBranding !== false}
                  className="w-full h-7 rounded cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50" 
                />
                {/* Quick color palette */}
                <div className="flex gap-0.5 mt-1">
                  {['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map(c => (
                    <button
                      key={c}
                      onClick={() => { update({ color: c, textGradient: undefined }); addColor(c); }}
                      title={c}
                      className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                        (el.color || '#ffffff') === c ? 'border-white ring-1 ring-violet-400 scale-110' : 'border-neutral-700'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-500">Recientes</span>
                    <div className="flex gap-1 flex-wrap">
                      {recentColors.map((c, idx) => (
                        <button
                          key={`${c}-${idx}`}
                          onClick={() => update({ color: c, textGradient: undefined })}
                          title={c}
                          className="w-5 h-5 rounded border border-neutral-700 hover:border-neutral-500 transition-colors"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* ── Color Avanzado (collapsible) ── */}
                <CollapsibleSection
                  title="Color Avanzado"
                  badge={[el.textGradient ? 1 : 0].reduce((a, b) => a + b, 0) || undefined}
                >
                  {/* Color Harmony */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-500">Armonía de Color</span>
                    <div className="flex gap-1">
                      {(() => {
                        const hex = el.color ?? '#ffffff';
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        const max = Math.max(r, g, b) / 255;
                        const min = Math.min(r, g, b) / 255;
                        const l = (max + min) / 2;
                        let h = 0;
                        if (max !== min) {
                          const d = max - min;
                          const rn = r / 255, gn = g / 255, bn = b / 255;
                          if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
                          else if (max === gn) h = ((bn - rn) / d + 2) * 60;
                          else h = ((rn - gn) / d + 4) * 60;
                        }
                        const complementary = `hsl(${(h + 180) % 360}, 70%, ${l * 100}%)`;
                        const triadic1 = `hsl(${(h + 120) % 360}, 70%, ${l * 100}%)`;
                        const triadic2 = `hsl(${(h + 240) % 360}, 70%, ${l * 100}%)`;
                        const analogous1 = `hsl(${(h + 30) % 360}, 70%, ${l * 100}%)`;
                        const analogous2 = `hsl(${(h - 30 + 360) % 360}, 70%, ${l * 100}%)`;
                        const lighter = `hsl(${h}, 70%, ${Math.min(90, l * 100 + 15)}%)`;
                        return [complementary, triadic1, triadic2, analogous1, analogous2, lighter].map((color, i) => (
                          <button
                            key={i}
                            onClick={() => { update({ color, textGradient: undefined }); addColor(color); }}
                            title={color}
                            className="w-5 h-5 rounded border border-neutral-700 hover:border-neutral-500 transition-colors"
                            style={{ backgroundColor: color }}
                          />
                        ));
                      })()}
                    </div>
                  </div>
                  {/* Gradient presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-500">Degradado</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: '🌅', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                        { label: '🌊', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
                        { label: '🍊', gradient: 'linear-gradient(135deg, #f5af19, #f12711)' },
                        { label: '💚', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
                        { label: '💜', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                        { label: '🌙', gradient: 'linear-gradient(135deg, #0c3483, #a2b6df)' },
                        { label: '🔥', gradient: 'linear-gradient(135deg, #ff512f, #dd2476)' },
                        { label: '🍋', gradient: 'linear-gradient(135deg, #f7ff00, #db36a4)' },
                      ].map(({ label, gradient }) => (
                        <button
                          key={gradient}
                          onClick={() => update({ textGradient: gradient })}
                          title={`Degradado ${label}`}
                          className={`h-6 rounded-md border transition-colors text-[10px] ${
                            el.textGradient === gradient
                              ? 'border-violet-500 ring-1 ring-violet-500/50'
                              : 'border-neutral-800 hover:border-neutral-600'
                          }`}
                          style={{ background: gradient }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {el.textGradient && (
                      <button
                        onClick={() => update({ textGradient: undefined })}
                        title="Quitar degradado"
                        className="text-[8px] text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        ✕ Quitar degradado
                      </button>
                    )}
                  </div>
                </CollapsibleSection>
              </div>

              <SliderRow
                label="Tamaño"
                value={el.fontSize ?? 48}
                min={12} max={120}
                suffix="px"
                onChange={(v) => update({ fontSize: v })}
              />
              <div className="flex gap-1">
                {[24, 36, 48, 64, 72, 96].map(size => (
                  <button
                    key={size}
                    onClick={() => update({ fontSize: size })}
                    title={`${size}px`}
                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                      (el.fontSize ?? 48) === size
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 mb-0.5 block">Fuente</span>
                <FontPicker
                  value={el.useBranding !== false && designMD ? designMD.baseFont : el.fontFamily || 'Inter'}
                  onChange={(font) => update({ fontFamily: font })}
                  disabled={el.useBranding !== false}
                  brandFont={designMD?.baseFont}
                />
              </div>
            </div>

            {/* ── Text Alignment ── */}
            <div className="mt-2">
              <span className="text-[10px] text-neutral-500 mb-1.5 block">Alineación</span>
              <div className="flex gap-1">
                {([
                  { value: 'left' as const, icon: '☰', label: 'Izquierda' },
                  { value: 'center' as const, icon: '☰', label: 'Centro' },
                  { value: 'right' as const, icon: '☰', label: 'Derecha' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ textAlign: opt.value })}
                    title={`Alinear ${opt.label}`}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all border flex items-center justify-center gap-1 ${
                      (el.textAlign ?? 'center') === opt.value
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {opt.value === 'left' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
                      {opt.value === 'center' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
                      {opt.value === 'right' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tipografía Avanzada (collapsible) ── */}
            <CollapsibleSection
              title="Tipografía Avanzada"
              badge={
                ((el.lineHeight != null && Math.abs(el.lineHeight - 1.2) > 0.05 ? 1 : 0) +
                 (el.letterSpacing ? 1 : 0) +
                 ((el.textStrokeWidth ?? 0) > 0 ? 1 : 0)) || undefined
              }
            >
            {/* ── Line Height & Letter Spacing ── */}
            <div className="space-y-2">
              <SliderRow
                label="Altura de Línea"
                value={el.lineHeight ?? 1.2}
                min={0.8} max={3.0} step={0.1}
                suffix="x"
                onChange={(v) => update({ lineHeight: v })}
              />
              <div className="flex gap-1">
                {[1, 1.2, 1.5, 2].map(lh => (
                  <button
                    key={lh}
                    onClick={() => update({ lineHeight: lh })}
                    title={`${lh}x`}
                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                      Math.abs((el.lineHeight ?? 1.2) - lh) < 0.05
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {lh}x
                  </button>
                ))}
              </div>
              <SliderRow
                label="Espaciado"
                value={el.letterSpacing ?? 0}
                min={-5} max={20} step={0.5}
                suffix="px"
                onChange={(v) => update({ letterSpacing: v })}
              />
              <div className="flex gap-1">
                {[0, 2, 5, 10].map(ls => (
                  <button
                    key={ls}
                    onClick={() => update({ letterSpacing: ls })}
                    title={`${ls}px`}
                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                      (el.letterSpacing ?? 0) === ls
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {ls}px
                  </button>
                ))}
              </div>
            </div>

            {/* ── Text Stroke / Outline ── */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-neutral-500">Contorno</span>
                <input
                  type="checkbox"
                  checked={(el.textStrokeWidth ?? 0) > 0}
                  onChange={(e) => update({
                    textStrokeWidth: e.target.checked ? 2 : 0,
                    textStrokeColor: el.textStrokeColor ?? '#000000',
                  })}
                  className="accent-violet-500 w-3 h-3"
                />
              </div>
              {(el.textStrokeWidth ?? 0) > 0 && (
                <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-10">Color</span>
                    <input
                      type="color"
                      value={el.textStrokeColor ?? '#000000'}
                      onChange={(e) => update({ textStrokeColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                      title="Color del contorno"
                    />
                    <span className="text-[9px] font-mono text-neutral-500">{el.textStrokeColor ?? '#000000'}</span>
                  </div>
                  <SliderRow
                    label="Grosor"
                    value={el.textStrokeWidth ?? 2}
                    min={0.5} max={10} step={0.5}
                    suffix="px"
                    onChange={(v) => update({ textStrokeWidth: v })}
                  />
                </div>
              )}
            </div>
            </CollapsibleSection>

            {/* ── Bold / Italic / Underline ── */}
            <div className="mt-2">
              <span className="text-[10px] text-neutral-500 mb-1.5 block">Estilo</span>
              <div className="flex gap-1">
                <button
                  onClick={() => update({ fontWeight: (el.fontWeight ?? 700) >= 700 ? 400 : 700 })}
                  title="Negrita"
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                    (el.fontWeight ?? 700) >= 700
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  B
                </button>
                <button
                  onClick={() => update({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  title="Itálica"
                  className={`flex-1 py-1.5 rounded-md text-[11px] italic transition-all border ${
                    el.fontStyle === 'italic'
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  I
                </button>
                <button
                  onClick={() => update({ textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })}
                  title="Subrayado"
                  className={`flex-1 py-1.5 rounded-md text-[11px] underline transition-all border ${
                    el.textDecoration === 'underline'
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  U
                </button>
                <button
                  onClick={() => update({ textDecoration: el.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                  title="Tachado"
                  className={`flex-1 py-1.5 rounded-md text-[11px] line-through transition-all border ${
                    el.textDecoration === 'line-through'
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  S
                </button>
              </div>
            </div>

            {/* ── Efectos de Texto (collapsible) ── */}
            <CollapsibleSection
              title="Efectos de Texto"
              badge={
                ((el.textBackground ? 1 : 0) +
                 (el.textTransform && el.textTransform !== 'none' ? 1 : 0) +
                 (el.width ? 1 : 0)) || undefined
              }
            >
            {/* ── Font Weight Presets ── */}
            <div>
              <span className="text-[9px] text-neutral-500 mb-1 block">Peso de Fuente</span>
              <div className="grid grid-cols-6 gap-0.5">
                {[
                  { val: 300, label: 'Light' },
                  { val: 400, label: 'Regular' },
                  { val: 500, label: 'Medium' },
                  { val: 600, label: 'Semi' },
                  { val: 700, label: 'Bold' },
                  { val: 900, label: 'Black' },
                ].map(fw => (
                  <button
                    key={fw.val}
                    onClick={() => update({ fontWeight: fw.val })}
                    title={`${fw.label} (${fw.val})`}
                    className={`py-0.5 rounded text-[7px] transition-colors border ${
                      (el.fontWeight ?? 700) === fw.val
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                    style={{ fontWeight: fw.val }}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Text Transform ── */}
            <div className="space-y-1">
              <span className="text-[9px] text-neutral-500">Transformar</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { value: 'none' as const, label: 'Aa', desc: 'Normal' },
                  { value: 'uppercase' as const, label: 'AA', desc: 'MAYÚSCULAS' },
                  { value: 'lowercase' as const, label: 'aa', desc: 'minúsculas' },
                  { value: 'capitalize' as const, label: 'Ab', desc: 'Capitalizar' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ textTransform: opt.value })}
                    title={opt.desc}
                    className={`py-1 rounded-md text-[10px] font-medium transition-all border ${
                      (el.textTransform ?? 'none') === opt.value
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Text Width (wrap control) ── */}
            <div className="mt-2">
              <SliderRow
                label="Ancho de Texto"
                value={el.width ?? 0}
                min={0} max={100}
                suffix="%"
                onChange={(v) => update({ width: v > 0 ? v : undefined })}
              />
              <div className="flex gap-1 mt-0.5">
                {[
                  { val: 0, label: 'Auto' },
                  { val: 50, label: '50%' },
                  { val: 75, label: '75%' },
                  { val: 100, label: '100%' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => update({ width: opt.val > 0 ? opt.val : undefined })}
                    title={opt.label}
                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                      (el.width ?? 0) === opt.val
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Text Style Presets ── */}
            <TextStylePresets element={el} onUpdate={update} />

            {/* ── Text Background ── */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-neutral-500">Fondo de Texto</span>
                <input
                  type="checkbox"
                  checked={!!el.textBackground}
                  onChange={(e) => update({
                    textBackground: e.target.checked ? '#000000AA' : undefined,
                    textBackgroundPadding: el.textBackgroundPadding ?? 8,
                    textBackgroundRadius: el.textBackgroundRadius ?? 4,
                  })}
                  className="accent-violet-500 w-3 h-3"
                />
              </div>
              {el.textBackground && (
                <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-10">Color</span>
                    <input
                      type="color"
                      value={el.textBackground.slice(0, 7)}
                      onChange={(e) => update({ textBackground: e.target.value + (el.textBackground?.slice(7) || 'AA') })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                      title="Color del fondo"
                    />
                    <span className="text-[9px] font-mono text-neutral-500">{el.textBackground}</span>
                  </div>
                  <SliderRow
                    label="Opacidad"
                    value={parseInt(el.textBackground.slice(7) || 'AA', 16) / 255 * 100}
                    min={0} max={100} step={5}
                    suffix="%"
                    onChange={(v) => {
                      const hex = Math.round(v / 100 * 255).toString(16).padStart(2, '0').toUpperCase();
                      update({ textBackground: (el.textBackground?.slice(0, 7) || '#000000') + hex });
                    }}
                  />
                  <SliderRow
                    label="Padding"
                    value={el.textBackgroundPadding ?? 8}
                    min={2} max={20} step={1}
                    suffix="px"
                    onChange={(v) => update({ textBackgroundPadding: v })}
                  />
                  <SliderRow
                    label="Redondeo"
                    value={el.textBackgroundRadius ?? 4}
                    min={0} max={20} step={1}
                    suffix="px"
                    onChange={(v) => update({ textBackgroundRadius: v })}
                  />
                </div>
              )}
            </div>
            </CollapsibleSection>
          </div>
        )}

        {/* ═══ Shape Properties ═══ */}
        {el.type === 'shape' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide">
              Forma
            </h3>
            <div className="space-y-2">
              {/* Fill Color */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 w-14">Relleno</span>
                <input
                  type="color"
                  value={el.shapeFill ?? '#ffffff'}
                  onChange={(e) => update({ shapeFill: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                  title="Color de relleno"
                />
                <span className="text-[9px] font-mono text-neutral-500">{el.shapeFill ?? '#ffffff'}</span>
              </div>
              <div className="flex gap-1">
                {[
                  { color: '#ffffff', label: '⬜' },
                  { color: '#000000', label: '⬛' },
                  { color: '#ef4444', label: '🟥' },
                  { color: '#3b82f6', label: '🟦' },
                  { color: '#22c55e', label: '🟩' },
                  { color: '#eab308', label: '🟨' },
                  { color: '#a855f7', label: '🟪' },
                  { color: '#f97316', label: '🟧' },
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => update({ shapeFill: c.color })}
                    title={c.color}
                    className={`w-5 h-5 rounded border transition-all ${
                      (el.shapeFill ?? '#ffffff') === c.color
                        ? 'border-violet-500 scale-110'
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              {/* Stroke */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 w-14">Borde</span>
                <input
                  type="color"
                  value={el.shapeStroke === 'none' ? '#000000' : (el.shapeStroke ?? '#000000')}
                  onChange={(e) => update({ shapeStroke: e.target.value, shapeStrokeWidth: Math.max(el.shapeStrokeWidth ?? 0, 2) })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                  title="Color del borde"
                />
                <input
                  type="checkbox"
                  checked={el.shapeStroke !== 'none' && (el.shapeStrokeWidth ?? 0) > 0}
                  onChange={(e) => update({
                    shapeStroke: e.target.checked ? '#000000' : 'none',
                    shapeStrokeWidth: e.target.checked ? 2 : 0,
                  })}
                  className="accent-violet-500 w-3 h-3"
                  title="Activar borde"
                />
              </div>
              {(el.shapeStrokeWidth ?? 0) > 0 && (
                <SliderRow
                  label="Grosor Borde"
                  value={el.shapeStrokeWidth ?? 2}
                  min={1} max={10} step={0.5}
                  suffix="px"
                  onChange={(v) => update({ shapeStrokeWidth: v })}
                />
              )}
              {/* Corner Radius — only for rectangles */}
              {(el.shapeType === 'rectangle' || !el.shapeType) && (
                <>
                <SliderRow
                  label="Redondeo"
                  value={el.shapeCornerRadius ?? 0}
                  min={0} max={50} step={1}
                  suffix="px"
                  onChange={(v) => update({ shapeCornerRadius: v })}
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 20, 50].map(r => (
                    <button
                      key={r}
                      onClick={() => update({ shapeCornerRadius: r })}
                      title={`${r}px`}
                      className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                        (el.shapeCornerRadius ?? 0) === r
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ Transitions (In/Out) ═══ */}
        {el.type !== 'audio' && outputFormat !== 'image' && (
          <div className="space-y-3">
            <TransitionPicker
              label="Transición de Entrada"
              current={el.transitionIn?.type || 'none'}
              duration={el.transitionIn?.duration ?? 15}
              isText={el.type === 'text'}
              onChange={(type) => {
                if (type === 'none') {
                  setTimelineElements(prev => updateElementTransition(prev, el.id, 'transitionIn', undefined));
                } else {
                  update({ transitionIn: { type: type as any, duration: el.transitionIn?.duration ?? 15 } });
                }
              }}
              onDurationChange={(d) => {
                if (el.transitionIn) {
                  update({ transitionIn: { ...el.transitionIn, duration: d } });
                }
              }}
            />
            <TransitionPicker
              label="Transición de Salida"
              current={el.transitionOut?.type || 'none'}
              duration={el.transitionOut?.duration ?? 15}
              isText={el.type === 'text'}
              onChange={(type) => {
                if (type === 'none') {
                  setTimelineElements(prev => updateElementTransition(prev, el.id, 'transitionOut', undefined));
                } else {
                  update({ transitionOut: { type: type as any, duration: el.transitionOut?.duration ?? 15 } });
                }
              }}
              onDurationChange={(d) => {
                if (el.transitionOut) {
                  update({ transitionOut: { ...el.transitionOut, duration: d } });
                }
              }}
            />
          </div>
        )}

        {/* ═══ Animation Combos ═══ */}
        {el.type !== 'audio' && outputFormat !== 'image' && (
          <div className="space-y-1">
            <span className="text-[9px] text-neutral-500 block">Combos de Animación</span>
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: '💫 Pop', inType: 'scale', outType: 'scale', duration: 10 },
                { label: '➡️ Slide', inType: 'slideLeft', outType: 'slideRight', duration: 15 },
                { label: '🌫 Fade', inType: 'fade', outType: 'fade', duration: 20 },
                { label: '🔍 Zoom', inType: 'zoom', outType: 'zoom', duration: 15 },
                { label: '🎭 Drama', inType: 'blur', outType: 'fade', duration: 30 },
              ].map(combo => (
                <button
                  key={combo.label}
                  onClick={() => update({
                    transitionIn: { type: combo.inType as any, duration: combo.duration },
                    transitionOut: { type: combo.outType as any, duration: combo.duration },
                  })}
                  title={`In: ${combo.inType} / Out: ${combo.outType}`}
                  className="py-1 rounded text-[7px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
                >
                  {combo.label}
                </button>
              ))}
            </div>
            {(el.transitionIn || el.transitionOut) && (
              <button
                onClick={() => update({ transitionIn: undefined, transitionOut: undefined })}
                title="Quitar todas las transiciones"
                className="w-full py-0.5 rounded text-[7px] text-neutral-600 hover:text-red-400 transition-colors"
              >
                ✕ Quitar animaciones
              </button>
            )}
          </div>
        )}

        {/* ═══ Timing ═══ */}
        {outputFormat !== 'image' && (
          <div>
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Tiempos</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Inicio ({timeUnit === 'frames' ? 'f' : 's'})</label>
                <input 
                  type="number" 
                  step={timeUnit === 'seconds' ? 0.01 : 1}
                  value={timeUnit === 'frames' ? el.startFrame : Number((el.startFrame / 30).toFixed(2))} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    update({ startFrame: timeUnit === 'seconds' ? Math.round(val * 30) : Math.round(val) });
                  }}
                  className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-violet-500/50" 
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Fin ({timeUnit === 'frames' ? 'f' : 's'})</label>
                <input 
                  type="number" 
                  step={timeUnit === 'seconds' ? 0.01 : 1}
                  value={timeUnit === 'frames' ? el.endFrame : Number((el.endFrame / 30).toFixed(2))} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    update({ endFrame: timeUnit === 'seconds' ? Math.round(val * 30) : Math.round(val) });
                  }}
                  className="bg-neutral-950 rounded-lg px-2 py-1.5 w-full border border-neutral-800 outline-none text-center font-mono text-xs focus:border-violet-500/50" 
                />
              </div>
            </div>
            <div className="flex gap-1 mt-1">
              {[
                { label: '1s', frames: 30 },
                { label: '2s', frames: 60 },
                { label: '3s', frames: 90 },
                { label: '5s', frames: 150 },
                { label: '10s', frames: 300 },
              ].map(d => (
                <button
                  key={d.label}
                  onClick={() => update({ endFrame: el.startFrame + d.frames })}
                  title={`Duración: ${d.label}`}
                  className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                    (el.endFrame - el.startFrame) === d.frames
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Transform Controls (Opacity, Scale, Rotation) ═══ */}
        {el.type !== 'audio' && (
          <div className="space-y-2 bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-800/30">
            <SliderRow
              label="Opacidad"
              value={el.opacity ?? 100}
              min={0} max={100}
              suffix="%"
              onChange={(v) => update({ opacity: v })}
            />
            <div className="flex gap-1">
              {[25, 50, 75, 100].map(val => (
                <button
                  key={val}
                  onClick={() => update({ opacity: val })}
                  title={`${val}%`}
                  className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                    Math.round(el.opacity ?? 100) === val
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
            <SliderRow
              label="Escala"
              value={el.scale ?? 1}
              min={0.1} max={5}
              step={0.1}
              suffix="x"
              onChange={(v) => update({ scale: v })}
            />
            <div className="flex gap-1">
              {[0.5, 0.75, 1, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => update({ scale: s })}
                  title={`${s}x`}
                  className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                    Math.abs((el.scale ?? 1) - s) < 0.05
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <SliderRow
                label="Rotación"
                value={el.rotation ?? 0}
                min={0} max={360}
                suffix="°"
                onChange={(v) => update({ rotation: v })}
              />
              <div className="flex gap-1">
                {[0, 90, 180, 270].map(deg => (
                  <button
                    key={deg}
                    onClick={() => update({ rotation: deg })}
                    title={`${deg}°`}
                    className={`flex-1 py-0.5 rounded text-[8px] font-medium transition-colors border ${
                      (el.rotation ?? 0) === deg
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
              <div className="flex gap-0.5 mt-0.5">
                {[
                  { label: '-45°', delta: -45 },
                  { label: '-15°', delta: -15 },
                  { label: '+15°', delta: 15 },
                  { label: '+45°', delta: 45 },
                ].map(snap => (
                  <button
                    key={snap.label}
                    onClick={() => update({ rotation: ((el.rotation ?? 0) + snap.delta + 360) % 360 })}
                    title={`Rotar ${snap.label}`}
                    className="flex-1 py-0.5 rounded text-[7px] font-mono bg-neutral-950 border border-neutral-800/50 text-neutral-600 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
                  >
                    {snap.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Fit Mode (Image/Video) ═══ */}
        {(el.type === 'image' || el.type === 'video') && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Ajuste de Imagen</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'contain' as const, label: 'Contener', icon: '📐', desc: 'Muestra toda la imagen' },
                { value: 'cover' as const, label: 'Cubrir', icon: '🔲', desc: 'Llena el área, recorta' },
                { value: 'fill' as const, label: 'Estirar', icon: '↔️', desc: 'Estira para llenar' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ objectFit: opt.value })}
                  title={opt.desc}
                  className={`py-1.5 px-1 rounded-lg text-[9px] font-medium transition-all border ${
                    (el.objectFit ?? 'contain') === opt.value
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-sm block">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Color Palette Extractor (Images) ═══ */}
        {el.type === 'image' && el.content && (
          <div className="bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-800/30">
            <ColorPaletteExtractor
              imageUrl={el.content}
              onColorSelect={(color) => update({ color })}
            />
          </div>
        )}

        {/* ═══ Focal Point (Cover mode) ═══ */}
        {(el.type === 'image' || el.type === 'video') && (el.objectFit === 'cover') && (
          <div className="space-y-1">
            <span className="text-[9px] text-neutral-500 block">Punto Focal (Cover)</span>
            <div className="grid grid-cols-3 gap-px w-16 mx-auto">
              {[
                { pos: 'left top', label: '↖' },
                { pos: 'center top', label: '↑' },
                { pos: 'right top', label: '↗' },
                { pos: 'left center', label: '←' },
                { pos: 'center center', label: '◎' },
                { pos: 'right center', label: '→' },
                { pos: 'left bottom', label: '↙' },
                { pos: 'center bottom', label: '↓' },
                { pos: 'right bottom', label: '↘' },
              ].map((fp) => {
                const isActive = (el.objectPosition ?? 'center center') === fp.pos;
                return (
                  <button
                    key={fp.pos}
                    onClick={() => update({ objectPosition: fp.pos })}
                    title={fp.pos}
                    className={`w-5 h-5 rounded-sm text-[8px] flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/50'
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                    }`}
                  >
                    {fp.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Quick Actions ═══ */}
        {el.type !== 'audio' && (
          <div className="flex gap-1">
            <button
              onClick={() => update({ x: 50, y: 50 })}
              title="Centrar en canvas"
              className="flex-1 py-1.5 rounded-lg text-[9px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
            >
              ◎ Centrar
            </button>
            <button
              onClick={() => update({ opacity: 100, scale: 1, rotation: 0, x: 50, y: 50 })}
              title="Resetear posición, escala, rotación y opacidad"
              className="flex-1 py-1.5 rounded-lg text-[9px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
            >
              ↺ Reset Todo
            </button>
            <button
              onClick={() => update({ width: el.type === 'text' ? undefined : 100, x: 50, y: 50, scale: 1 })}
              title="Ajustar al canvas completo"
              className="flex-1 py-1.5 rounded-lg text-[9px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
            >
              ⊞ Llenar
            </button>
          </div>
        )}
        {el.type !== 'audio' && (
          <div className="flex gap-1">
            <button
              onClick={() => update({
                x: Math.round(10 + Math.random() * 80),
                y: Math.round(10 + Math.random() * 80),
                rotation: Math.round(Math.random() * 360),
                scale: +(0.5 + Math.random() * 1.5).toFixed(1),
              })}
              title="Posición, rotación y escala aleatorias"
              className="flex-1 py-1 rounded-lg text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-pink-300 hover:border-pink-500/30 transition-colors"
            >
              🎲 Random
            </button>
            <button
              onClick={() => update({
                brightness: undefined, contrast: undefined, saturation: undefined,
                hueRotate: undefined, sepia: undefined, blurAmount: undefined,
                borderWidth: undefined, borderColor: undefined, borderRadius: undefined,
                borderStyle: undefined, boxShadowX: undefined, boxShadowY: undefined,
                boxShadowBlur: undefined, boxShadowColor: undefined,
              })}
              title="Limpiar todos los efectos visuales"
              className="flex-1 py-1 rounded-lg text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-300 hover:border-red-500/30 transition-colors"
            >
              🧹 Limpiar FX
            </button>
          </div>
        )}

        {/* ═══ Collapsible: Position ═══ */}
        {el.type !== 'audio' && (
          <div>
            <SectionHeader title="Posición" open={showPosition} onToggle={() => setShowPosition(!showPosition)} />
            {showPosition && (
              <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-2 mt-1">
                <SliderRow label="X" value={Math.round(el.x)} min={0} max={100} suffix="%" onChange={(v) => update({ x: v })} />
                <SliderRow label="Y" value={Math.round(el.y)} min={0} max={100} suffix="%" onChange={(v) => update({ y: v })} />
                {/* Width slider — only for image/video/sticker elements */}
                {el.type !== 'text' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SliderRow
                        label="Ancho"
                        value={el.width ?? 25}
                        min={5} max={100}
                        suffix="%"
                        onChange={(v) => update({ width: v })}
                      />
                    </div>
                    <button
                      onClick={() => update({ width: 25 })}
                      title="Resetear ancho"
                      className="text-[9px] text-neutral-600 hover:text-neutral-300 px-1 py-0.5 rounded hover:bg-neutral-800 transition-colors mt-3"
                    >
                      ↺
                    </button>
                  </div>
                )}
                {el.type !== 'text' && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => update({ aspectLocked: !el.aspectLocked })}
                      title={el.aspectLocked ? "Desbloquear proporción" : "Bloquear proporción (aspecto)"}
                      className={`px-2 py-0.5 rounded text-[8px] transition-all border ${
                        el.aspectLocked
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      {el.aspectLocked ? '🔒 Proporción fija' : '🔓 Proporción libre'}
                    </button>
                  </div>
                )}
                {el.type !== 'text' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SliderRow
                        label="Alto"
                        value={el.h ?? 100}
                        min={5} max={100}
                        suffix="%"
                        onChange={(v) => update({ h: v })}
                      />
                    </div>
                    <button
                      onClick={() => update({ h: 100 })}
                      title="Resetear alto"
                      className="text-[9px] text-neutral-600 hover:text-neutral-300 px-1 py-0.5 rounded hover:bg-neutral-800 transition-colors mt-3"
                    >
                      ↺
                    </button>
                  </div>
                )}
                <div className="flex gap-1">
                  {[10, 25, 50, 75, 100].map(w => (
                    <button
                      key={w}
                      onClick={() => update({ width: w })}
                      title={`${w}%`}
                      className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors border ${
                        (el.width ?? 25) === w
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      {w}%
                    </button>
                  ))}
                </div>
                {/* Quick position presets (9-point grid) */}
                <div className="pt-1">
                  <label className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1 block">Posición rápida</label>
                  <div className="grid grid-cols-3 gap-0.5 w-20 mx-auto">
                    {[
                      { x: 15, y: 15 }, { x: 50, y: 15 }, { x: 85, y: 15 },
                      { x: 15, y: 50 }, { x: 50, y: 50 }, { x: 85, y: 50 },
                      { x: 15, y: 85 }, { x: 50, y: 85 }, { x: 85, y: 85 },
                    ].map((pos, idx) => {
                      const isActive = Math.abs(el.x - pos.x) < 3 && Math.abs(el.y - pos.y) < 3;
                      return (
                        <button
                          key={idx}
                          onClick={() => update({ x: pos.x, y: pos.y })}
                          title={`Mover a ${pos.x}%, ${pos.y}%`}
                          className={`w-6 h-6 rounded-sm border transition-all flex items-center justify-center ${
                            isActive
                              ? 'bg-violet-500/40 border-violet-500 shadow-sm'
                              : 'bg-neutral-800/60 border-neutral-700/50 hover:bg-neutral-700/60 hover:border-neutral-600'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-violet-300' : 'bg-neutral-500'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ═══ Quick Alignment ═══ */}
        {el.type !== 'audio' && (
          <div className="flex items-center gap-0.5 px-1 py-1 bg-neutral-950/30 rounded-md border border-neutral-800/30">
            <span className="text-[9px] text-neutral-500 mr-1">Alinear</span>
            <button title="Alinear izquierda" onClick={() => update({ x: 10 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="4" y2="20"/><rect x="8" y="6" width="12" height="4" rx="1" fill="currentColor" opacity="0.3"/><rect x="8" y="14" width="8" height="4" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
            <button title="Centrar horizontal" onClick={() => update({ x: 50 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="4" x2="12" y2="20"/><rect x="6" y="6" width="12" height="4" rx="1" fill="currentColor" opacity="0.3"/><rect x="8" y="14" width="8" height="4" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
            <button title="Alinear derecha" onClick={() => update({ x: 90 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="20" y1="4" x2="20" y2="20"/><rect x="4" y="6" width="12" height="4" rx="1" fill="currentColor" opacity="0.3"/><rect x="8" y="14" width="8" height="4" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
            <div className="w-px h-4 bg-neutral-700 mx-0.5" />
            <button title="Alinear arriba" onClick={() => update({ y: 10 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="4"/><rect x="6" y="8" width="4" height="12" rx="1" fill="currentColor" opacity="0.3"/><rect x="14" y="8" width="4" height="8" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
            <button title="Centrar vertical" onClick={() => update({ y: 50 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><rect x="6" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.3"/><rect x="14" y="8" width="4" height="8" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
            <button title="Alinear abajo" onClick={() => update({ y: 90 })} className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="4" width="4" height="12" rx="1" fill="currentColor" opacity="0.3"/><rect x="14" y="8" width="4" height="8" rx="1" fill="currentColor" opacity="0.3"/></svg>
            </button>
          </div>
        )}

        {/* ═══ 9-Grid Position Anchor ═══ */}
        {el.type !== 'audio' && (
          <div className="px-1 py-1 bg-neutral-950/30 rounded-md border border-neutral-800/30">
            <span className="text-[9px] text-neutral-500 mb-1 block">Posición Rápida</span>
            <div className="grid grid-cols-3 gap-px w-16 mx-auto">
              {[
                { x: 15, y: 15 }, { x: 50, y: 15 }, { x: 85, y: 15 },
                { x: 15, y: 50 }, { x: 50, y: 50 }, { x: 85, y: 50 },
                { x: 15, y: 85 }, { x: 50, y: 85 }, { x: 85, y: 85 },
              ].map((pos, i) => {
                const isActive = Math.abs((el.x ?? 50) - pos.x) < 5 && Math.abs((el.y ?? 50) - pos.y) < 5;
                return (
                  <button
                    key={i}
                    onClick={() => update({ x: pos.x, y: pos.y })}
                    title={`X:${pos.x}% Y:${pos.y}%`}
                    className={`w-5 h-5 rounded-sm transition-all ${
                      isActive
                        ? 'bg-violet-500 shadow-sm shadow-violet-500/50'
                        : 'bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Z-Order (Layer Depth) ═══ */}
        {el.type !== 'audio' && (
          <div className="flex items-center gap-0.5 px-1 py-1 bg-neutral-950/30 rounded-md border border-neutral-800/30">
            <span className="text-[9px] text-neutral-500 mr-1">Orden</span>
            <button
              title="Enviar al fondo"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx <= 0) return prev;
                  const next = [...prev];
                  const [item] = next.splice(idx, 1);
                  next.unshift(item);
                  return next;
                });
              }}
              className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 18 12 22 6 18"/><polyline points="18 14 12 18 6 14"/><polyline points="18 6 12 10 6 6"/></svg>
            </button>
            <button
              title="Mover atrás"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx <= 0) return prev;
                  const next = [...prev];
                  [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                  return next;
                });
              }}
              className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 14 12 18 18 14"/></svg>
            </button>
            <button
              title="Mover adelante"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx >= prev.length - 1) return prev;
                  const next = [...prev];
                  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                  return next;
                });
              }}
              className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 10 12 6 6 10"/></svg>
            </button>
            <button
              title="Traer al frente"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx >= prev.length - 1) return prev;
                  const next = [...prev];
                  const [item] = next.splice(idx, 1);
                  next.push(item);
                  return next;
                });
              }}
              className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 6 12 2 18 6"/><polyline points="6 10 12 6 18 10"/><polyline points="6 18 12 14 18 18"/></svg>
            </button>
          </div>
        )}

        {/* ═══ Flip / Mirror ═══ */}
        {el.type !== 'audio' && (
          <div className="flex items-center gap-1 px-1 py-1 bg-neutral-950/30 rounded-md border border-neutral-800/30">
            <span className="text-[9px] text-neutral-500 mr-1">Voltear</span>
            <button
              title="Voltear Horizontal"
              onClick={() => update({ flipH: !el.flipH })}
              className={`p-1.5 rounded transition-colors ${
                el.flipH
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M16 7l4 5-4 5M8 7L4 12l4 5" />
              </svg>
            </button>
            <button
              title="Voltear Vertical"
              onClick={() => update({ flipV: !el.flipV })}
              className={`p-1.5 rounded transition-colors ${
                el.flipV
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M7 16l5 4 5-4M7 8L12 4l5 4" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══ Z-Order ═══ */}
        {el.type !== 'audio' && (
          <div className="flex items-center gap-1 px-1 py-1 bg-neutral-950/30 rounded-md border border-neutral-800/30">
            <span className="text-[9px] text-neutral-500 mr-1">Orden</span>
            <button
              title="Enviar al Frente"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx < 0 || idx === prev.length - 1) return prev;
                  const arr = [...prev];
                  const [item] = arr.splice(idx, 1);
                  arr.push(item);
                  return arr;
                });
              }}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/><rect x="10" y="10" width="12" height="12" rx="1"/></svg>
            </button>
            <button
              title="Subir una Capa"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx < 0 || idx === prev.length - 1) return prev;
                  const arr = [...prev];
                  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                  return arr;
                });
              }}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5l-7 7h14l-7-7z"/><line x1="12" y1="12" x2="12" y2="19"/></svg>
            </button>
            <button
              title="Bajar una Capa"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx <= 0) return prev;
                  const arr = [...prev];
                  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                  return arr;
                });
              }}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l-7-7h14l-7 7z"/><line x1="12" y1="12" x2="12" y2="5"/></svg>
            </button>
            <button
              title="Enviar al Fondo"
              onClick={() => {
                setTimelineElements(prev => {
                  const idx = prev.findIndex(e => e.id === el.id);
                  if (idx <= 0) return prev;
                  const arr = [...prev];
                  const [item] = arr.splice(idx, 1);
                  arr.unshift(item);
                  return arr;
                });
              }}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="12" height="12" rx="1"/><rect x="10" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/></svg>
            </button>
          </div>
        )}

        {/* ═══ Collapsible: Color Adjustments ═══ */}
        {(el.type === 'image' || el.type === 'sticker' || el.type === 'video') && (
          <div>
            <SectionHeader title="Ajustes de Color" open={showColorAdjust} onToggle={() => setShowColorAdjust(!showColorAdjust)} />
            {showColorAdjust && (
              <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-2 mt-1">
                <SliderRow label="Brillo" value={el.brightness ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ brightness: v })} />
                <SliderRow label="Contraste" value={el.contrast ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ contrast: v })} />
                <SliderRow label="Saturación" value={el.saturation ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ saturation: v })} />
                <SliderRow label="Matiz" value={el.hueRotate ?? 0} min={0} max={360} suffix="°" onChange={(v) => update({ hueRotate: v > 0 ? v : undefined })} />
                <SliderRow label="Sepia" value={el.sepia ?? 0} min={0} max={100} suffix="%" onChange={(v) => update({ sepia: v > 0 ? v : undefined })} />
                <div className="border-t border-neutral-800/50 pt-2 mt-2">
                  <FilterPresets element={el} onUpdate={update} />
                </div>
                {/* Quick Color Grading Presets */}
                <div className="border-t border-neutral-800/50 pt-2 mt-2">
                  <span className="text-[9px] text-neutral-500 block mb-1">Corrección de Color</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'Normal', b: 100, c: 100, s: 100 },
                      { label: 'Cálido', b: 110, c: 105, s: 120 },
                      { label: 'Frío', b: 100, c: 110, s: 80 },
                      { label: 'Drama', b: 90, c: 140, s: 110 },
                      { label: 'Vintage', b: 110, c: 90, s: 70 },
                      { label: 'B/N', b: 100, c: 120, s: 0 },
                      { label: 'Vivido', b: 105, c: 110, s: 160 },
                      { label: 'Suave', b: 115, c: 85, s: 90 },
                    ].map(p => (
                      <button
                        key={p.label}
                        onClick={() => update({ brightness: p.b, contrast: p.c, saturation: p.s })}
                        title={`Brillo:${p.b} Contraste:${p.c} Saturación:${p.s}`}
                        className={`py-1 rounded text-[8px] font-medium transition-colors border ${
                          (el.brightness ?? 100) === p.b && (el.contrast ?? 100) === p.c && (el.saturation ?? 100) === p.s
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Collapsible: Border & Effects ═══ */}
        {el.type !== 'audio' && (
          <div>
            <SectionHeader title="Bordes y Efectos" open={showBorderEffects} onToggle={() => setShowBorderEffects(!showBorderEffects)} />
            {showBorderEffects && (
              <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-3 mt-1">
                {/* Border Width */}
                <SliderRow
                  label="Borde"
                  value={el.borderWidth ?? 0}
                  min={0} max={20}
                  suffix="px"
                  onChange={(v) => update({ borderWidth: v > 0 ? v : undefined })}
                />
                {/* Border Color */}
                {(el.borderWidth ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-neutral-500 w-14">Color</label>
                    <input
                      type="color"
                      value={el.borderColor ?? '#ffffff'}
                      onChange={(e) => update({ borderColor: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                      title="Color del borde"
                    />
                    <span className="text-[9px] text-neutral-500 font-mono">{el.borderColor ?? '#ffffff'}</span>
                  </div>
                )}
                {/* Border Radius */}
                <SliderRow
                  label="Redondeo"
                  value={el.borderRadius ?? 0}
                  min={0} max={50}
                  suffix="px"
                  onChange={(v) => update({ borderRadius: v > 0 ? v : undefined })}
                />
                <div className="flex gap-1">
                  {[
                    { val: 0, label: '■', desc: 'Sin redondeo' },
                    { val: 4, label: '▢', desc: '4px' },
                    { val: 8, label: '▣', desc: '8px' },
                    { val: 16, label: '◻', desc: '16px' },
                    { val: 24, label: '◯', desc: '24px' },
                    { val: 999, label: '●', desc: 'Círculo' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => update({ borderRadius: opt.val > 0 ? opt.val : undefined })}
                      title={opt.desc}
                      className={`flex-1 py-0.5 rounded text-[9px] transition-colors border ${
                        (el.borderRadius ?? 0) === opt.val
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Border Style */}
                {(el.borderWidth ?? 0) > 0 && (
                  <div>
                    <span className="text-[9px] text-neutral-500 mb-1 block">Estilo de Borde</span>
                    <div className="flex gap-1">
                      {(['solid', 'dashed', 'dotted'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => update({ borderStyle: style })}
                          title={style}
                          className={`flex-1 py-1 rounded text-[8px] font-medium transition-colors border ${
                            (el.borderStyle ?? 'solid') === style
                              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-400'
                          }`}
                        >
                          {style === 'solid' ? '━━' : style === 'dashed' ? '╌╌' : '┈┈'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Drop Shadow */}
                <div className="border-t border-neutral-800/50 pt-2 mt-1 space-y-2">
                  <span className="text-[9px] text-neutral-500 block">Sombra del Elemento</span>
                  <SliderRow label="X" value={el.boxShadowX ?? 0} min={-20} max={20} suffix="px" onChange={(v) => update({ boxShadowX: v })} />
                  <SliderRow label="Y" value={el.boxShadowY ?? 0} min={-20} max={20} suffix="px" onChange={(v) => update({ boxShadowY: v })} />
                  <SliderRow label="Difuminado" value={el.boxShadowBlur ?? 0} min={0} max={40} suffix="px" onChange={(v) => update({ boxShadowBlur: v })} />
                  {(el.boxShadowBlur || el.boxShadowX || el.boxShadowY) ? (
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] text-neutral-500 w-14">Color</label>
                      <input
                        type="color"
                        value={(el.boxShadowColor ?? 'rgba(0,0,0,0.5)').slice(0, 7) || '#000000'}
                        onChange={(e) => update({ boxShadowColor: e.target.value + '80' })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                        title="Color de sombra"
                      />
                    </div>
                  ) : null}
                  <div className="flex gap-1">
                    {[
                      { label: 'Sin', x: 0, y: 0, blur: 0 },
                      { label: 'Suave', x: 0, y: 4, blur: 12 },
                      { label: 'Fuerte', x: 2, y: 8, blur: 24 },
                      { label: 'Glow', x: 0, y: 0, blur: 20 },
                    ].map(p => (
                      <button
                        key={p.label}
                        onClick={() => update({ boxShadowX: p.x, boxShadowY: p.y, boxShadowBlur: p.blur, boxShadowColor: p.label === 'Glow' ? 'rgba(167,139,250,0.6)' : 'rgba(0,0,0,0.5)' })}
                        title={p.label}
                        className="flex-1 py-0.5 rounded text-[7px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Blur */}
                <SliderRow
                  label="Desenfoque"
                  value={el.blurAmount ?? 0}
                  min={0} max={20}
                  suffix="px"
                  onChange={(v) => update({ blurAmount: v > 0 ? v : undefined })}
                />
                {/* Quick Presets */}
                <div className="flex gap-1">
                  <button
                    onClick={() => update({ borderWidth: undefined, borderColor: undefined, borderRadius: undefined, borderStyle: undefined, blurAmount: undefined, boxShadowX: undefined, boxShadowY: undefined, boxShadowBlur: undefined, boxShadowColor: undefined })}
                    title="Sin efectos"
                    className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => update({ borderWidth: 2, borderColor: '#ffffff', borderRadius: 8 })}
                    title="Borde suave blanco"
                    className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Marco
                  </button>
                  <button
                    onClick={() => update({ borderRadius: 999 })}
                    title="Forma circular"
                    className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Círculo
                  </button>
                  <button
                    onClick={() => update({ blurAmount: 5 })}
                    title="Desenfoque suave"
                    className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Blur
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Collapsible: Keyframes ═══ */}
        {el.type !== 'audio' && outputFormat !== 'image' && (
          <div>
            <SectionHeader title="Keyframes" open={showKeyframes} onToggle={() => setShowKeyframes(!showKeyframes)} />
            {showKeyframes && (
              <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-2 mt-1">
                {/* Legacy mode toggle (backwards compatible) */}
                {!el.keyframes && (
                  <div className="flex items-center gap-2 mb-1">
                    <input 
                      type="checkbox" id="enableKeyframes"
                      checked={el.animEndX !== undefined}
                      onChange={(e) => {
                        setTimelineElements(prev => updateElementKeyframes(prev, i, e.target.checked, el));
                      }}
                      className="accent-violet-500 w-3 h-3"
                    />
                    <label htmlFor="enableKeyframes" className="text-[10px] text-neutral-300">Interpolación simple (inicio → fin)</label>
                  </div>
                )}

                {el.animEndX !== undefined && !el.keyframes && (
                  <>
                    <SliderRow label="Target X" value={el.animEndX} min={-50} max={150} suffix="%" onChange={(v) => update({ animEndX: v })} />
                    <SliderRow label="Target Y" value={el.animEndY ?? 0} min={-50} max={150} suffix="%" onChange={(v) => update({ animEndY: v })} />
                    <SliderRow label="Target Escala" value={el.animEndScale ?? 1} min={0} max={5} step={0.1} suffix="x" onChange={(v) => update({ animEndScale: v })} />
                    <SliderRow label="Target Opacidad" value={el.animEndOpacity ?? 100} min={0} max={100} suffix="%" onChange={(v) => update({ animEndOpacity: v })} />
                  </>
                )}

                {/* Multi-keyframe list */}
                {el.keyframes && el.keyframes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rotate-45 bg-violet-500 inline-block" />
                      {el.keyframes.length} keyframes
                    </div>
                    {el.keyframes.map((kf, kfIdx) => (
                      <div
                        key={kfIdx}
                        className="flex items-center gap-2 bg-neutral-900/60 rounded px-2 py-1.5 border border-neutral-800/40"
                      >
                        {/* Frame number */}
                        <span className="text-[10px] text-violet-300 font-mono w-10 shrink-0">
                          f{kf.frame}
                        </span>
                        {/* Position info */}
                        <span className="text-[9px] text-neutral-500 truncate flex-1">
                          x:{kf.x?.toFixed(0) ?? '–'} y:{kf.y?.toFixed(0) ?? '–'} s:{kf.scale?.toFixed(1) ?? '–'} r:{kf.rotation?.toFixed(0) ?? '–'}°
                        </span>
                        {/* Easing selector with visual curve */}
                        <select
                          value={kf.easing || 'linear'}
                          onChange={(e) => {
                            setTimelineElements(prev => prev.map(tel => {
                              if (tel.id !== el.id || !tel.keyframes) return tel;
                              const newKfs = [...tel.keyframes];
                              newKfs[kfIdx] = { ...newKfs[kfIdx], easing: e.target.value as any };
                              return { ...tel, keyframes: newKfs };
                            }));
                          }}
                          className="bg-neutral-800 text-[9px] text-neutral-300 px-1 py-0.5 rounded border border-neutral-700 focus:outline-none"
                          style={{ backgroundImage: 'none' }}
                        >
                          <option value="linear">📈 Linear</option>
                          <option value="ease-in">🐢 Ease In</option>
                          <option value="ease-out">🐇 Ease Out</option>
                          <option value="ease-in-out">🔄 In-Out</option>
                          <option value="bounce">🏀 Bounce</option>
                        </select>
                        {/* Delete button */}
                        <button
                          onClick={() => {
                            setTimelineElements(prev => prev.map(tel => {
                              if (tel.id !== el.id || !tel.keyframes) return tel;
                              const newKfs = tel.keyframes.filter((_, ki) => ki !== kfIdx);
                              return { ...tel, keyframes: newKfs.length > 0 ? newKfs : undefined };
                            }));
                          }}
                          className="text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Eliminar keyframe"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {/* Clear all keyframes */}
                    <button
                      onClick={() => update({ keyframes: undefined })}
                      className="text-[10px] text-rose-400/70 hover:text-rose-400 transition-colors"
                    >
                      Eliminar todos los keyframes
                    </button>
                  </div>
                )}

                {!el.keyframes && !el.animEndX && (
                  <p className="text-[10px] text-neutral-500 italic">
                    Usa el botón ◆ del toolbar para agregar keyframes en el frame actual
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ Collapsible: Text Shadow ═══ */}
        {el.type === 'text' && (
          <div>
            <SectionHeader title="Sombra de Texto" open={showShadow} onToggle={() => setShowShadow(!showShadow)} />
            {showShadow && (
              <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 space-y-2 mt-1">
                <SliderRow label="Desplazamiento" value={el.shadowOffset ?? 3} min={0} max={20} suffix="px" onChange={(v) => update({ shadowOffset: v })} />
                <SliderRow label="Difuminado" value={el.shadowBlur ?? 6} min={0} max={30} suffix="px" onChange={(v) => update({ shadowBlur: v })} />
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-neutral-500 w-14">Color</label>
                  <input
                    type="color"
                    value={el.shadowColor ?? '#000000'}
                    onChange={(e) => update({ shadowColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                    title="Color de sombra"
                  />
                  <span className="text-[9px] text-neutral-500 font-mono">{el.shadowColor ?? '#000000'}</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <button onClick={() => update({ shadowOffset: 0, shadowBlur: 0 })} title="Sin sombra" className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors">
                    Ninguna
                  </button>
                  <button onClick={() => update({ shadowOffset: 2, shadowBlur: 4 })} title="Sombra suave" className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors">
                    Suave
                  </button>
                  <button onClick={() => update({ shadowOffset: 4, shadowBlur: 8 })} title="Sombra media" className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors">
                    Media
                  </button>
                  <button onClick={() => update({ shadowOffset: 6, shadowBlur: 15 })} title="Sombra fuerte" className="flex-1 py-1 rounded-md text-[8px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors">
                    Fuerte
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
