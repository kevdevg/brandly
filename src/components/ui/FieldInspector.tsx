import React, { useState } from 'react';
import { Move, AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronRight, Palette } from 'lucide-react';
import { AlignmentTools } from './AlignmentTools';
import { FontPicker } from './FontPicker';
import { DesignMD } from '../../types';

/* ─── Types ─── */

export interface FieldPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FieldTextStyle {
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  useBrandStyle?: boolean;
  textRole?: 'title' | 'subtitle' | 'paragraph';
}

/** Resolve brand typography values for a given role */
export function resolveBrandRole(designMD: DesignMD, role: 'title' | 'subtitle' | 'paragraph') {
  switch (role) {
    case 'title': return {
      fontFamily: designMD.titleFont || designMD.baseFont,
      fontSize: designMD.titleSize || 48,
      fontWeight: 700,
      color: designMD.titleColor || designMD.textColor,
    };
    case 'subtitle': return {
      fontFamily: designMD.subtitleFont || designMD.baseFont,
      fontSize: designMD.subtitleSize || 32,
      fontWeight: 600,
      color: designMD.subtitleColor || designMD.textColor,
    };
    case 'paragraph': return {
      fontFamily: designMD.paragraphFont || designMD.baseFont,
      fontSize: designMD.paragraphSize || 18,
      fontWeight: 400,
      color: designMD.paragraphColor || designMD.textColor,
    };
  }
}

interface FieldInspectorProps {
  /** Current position (0-100 %) */
  position: FieldPosition;
  onPositionChange: (pos: Partial<FieldPosition>) => void;

  /** Text style (only rendered when provided) */
  textStyle?: FieldTextStyle;
  onTextStyleChange?: (style: Partial<FieldTextStyle>) => void;

  /** Field metadata */
  fieldType: 'text' | 'media' | 'logo' | 'brand-variable';
  fieldLabel: string;

  /** Brand context for FontPicker and color palette */
  brandFont?: string;
  brandColors?: string[];

  /** Resolved brand design for typography roles */
  resolvedDesignMD?: DesignMD;
}

/* ─── Collapsible Section ─── */

const Section: React.FC<{ title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title, icon, defaultOpen = true, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 text-[8px] text-neutral-400 font-semibold uppercase tracking-wider hover:text-neutral-200 transition-colors"
      >
        {icon}
        {title}
        {open ? <ChevronDown size={8} className="ml-auto" /> : <ChevronRight size={8} className="ml-auto" />}
      </button>
      {open && children}
    </div>
  );
};

/**
 * FieldInspector — Shared property inspector for positioned canvas fields.
 *
 * Used by:
 * - Template Builder (SceneConfigurator) for ExpressField
 * - Potentially Studio (ElementPropertiesPanel) in the future
 *
 * Reuses existing shared components: AlignmentTools, FontPicker.
 */
export const FieldInspector: React.FC<FieldInspectorProps> = ({
  position,
  onPositionChange,
  textStyle,
  onTextStyleChange,
  fieldType,
  fieldLabel,
  brandFont,
  brandColors = [],
  resolvedDesignMD,
}) => {
  const useBrand = textStyle?.useBrandStyle !== false;
  const currentRole = textStyle?.textRole || 'paragraph';
  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-2.5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-[8px] text-violet-300 font-semibold uppercase tracking-wider">
        <Move size={8} />
        {fieldLabel}
        <span className="ml-auto text-[7px] text-neutral-500 normal-case tracking-normal">
          {fieldType}
        </span>
      </div>

      {/* ── Position & Size Grid ── */}
      <Section title="Posición y Tamaño" icon={<Move size={8} />}>
        <div className="grid grid-cols-4 gap-1">
          {([
            { key: 'x' as const, label: 'X' },
            { key: 'y' as const, label: 'Y' },
            { key: 'w' as const, label: 'W' },
            { key: 'h' as const, label: 'H' },
          ]).map(p => (
            <div key={p.key} className="space-y-0.5">
              <label className="text-[7px] text-neutral-500 font-mono">{p.label}%</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={Math.round(position[p.key])}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  onPositionChange({ [p.key]: val });
                }}
                title={`${p.label} (${Math.round(position[p.key])}%)`}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] text-white text-center font-mono focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Alignment Tools */}
        <div className="pt-1.5">
          <AlignmentTools
            onAlign={(updates) => onPositionChange(updates as Partial<FieldPosition>)}
          />
        </div>
      </Section>

      {/* ── Text Styling (only for text fields) ── */}
      {textStyle && onTextStyleChange && (
        <Section title="Estilo de Texto" defaultOpen={true}>
          <div className="space-y-2">

            {/* ── Typographic Role Pills ── */}
            <div className="space-y-0.5">
              <label className="text-[7px] text-neutral-500 font-mono">Rol tipográfico</label>
              <div className="flex gap-0.5">
                {(['title', 'subtitle', 'paragraph'] as const).map(role => {
                  const labels = { title: 'Título', subtitle: 'Subtítulo', paragraph: 'Párrafo' };
                  const isActive = currentRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        const updates: Partial<FieldTextStyle> = { textRole: role };
                        // Auto-apply brand values when in brand mode
                        if (useBrand && resolvedDesignMD) {
                          const brandVals = resolveBrandRole(resolvedDesignMD, role);
                          Object.assign(updates, brandVals);
                        }
                        onTextStyleChange(updates);
                      }}
                      title={labels[role]}
                      className={`flex-1 py-1.5 rounded-md text-[9px] font-semibold transition-all border ${
                        isActive
                          ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 shadow-sm'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {labels[role]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Text Align (always visible) ── */}
            <div className="space-y-0.5">
              <label className="text-[7px] text-neutral-500 font-mono">Alineación</label>
              <div className="flex gap-0.5">
                {([
                  { value: 'left' as const, icon: <AlignLeft size={12} /> },
                  { value: 'center' as const, icon: <AlignCenter size={12} /> },
                  { value: 'right' as const, icon: <AlignRight size={12} /> },
                ]).map(a => (
                  <button
                    key={a.value}
                    onClick={() => onTextStyleChange({ textAlign: a.value })}
                    title={`Alinear ${a.value}`}
                    className={`flex-1 py-1 rounded-md border transition-all flex items-center justify-center ${
                      (textStyle.textAlign || 'center') === a.value
                        ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Brand toggle ── */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[8px] text-neutral-400 flex items-center gap-1 cursor-pointer">
                <Palette size={10} className={useBrand ? 'text-violet-400' : 'text-neutral-500'} />
                Usar marca
              </label>
              <button
                onClick={() => {
                  const nextUseBrand = !useBrand;
                  const updates: Partial<FieldTextStyle> = { useBrandStyle: nextUseBrand };
                  // When switching to brand mode, re-apply brand values
                  if (nextUseBrand && resolvedDesignMD) {
                    const brandVals = resolveBrandRole(resolvedDesignMD, currentRole);
                    Object.assign(updates, brandVals);
                  }
                  onTextStyleChange(updates);
                }}
                title={useBrand ? 'Desactivar estilos de marca' : 'Activar estilos de marca'}
                className={`w-8 h-4 rounded-full relative transition-all ${
                  useBrand ? 'bg-violet-600' : 'bg-neutral-700'
                }`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                  useBrand ? 'left-[18px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* ── Brand mode preview ── */}
            {useBrand && resolvedDesignMD && (
              <div className="bg-neutral-800/50 rounded-lg p-2 border border-neutral-700/50">
                {(() => {
                  const vals = resolveBrandRole(resolvedDesignMD, currentRole);
                  const fontName = (vals.fontFamily || 'Inter').split(',')[0].replace(/"/g, '');
                  return (
                    <div className="flex items-center gap-2 text-[8px] text-neutral-400">
                      <span className="font-mono">{fontName}</span>
                      <span>·</span>
                      <span className="font-mono">{vals.fontSize}px</span>
                      <span>·</span>
                      <span className="font-mono">{vals.fontWeight}</span>
                      <span>·</span>
                      <div className="w-3 h-3 rounded-full border border-neutral-600" style={{ backgroundColor: vals.color }} title={vals.color} />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Advanced controls (only when brand is OFF) ── */}
            {!useBrand && (
              <div className="space-y-2 pt-1 border-t border-neutral-800/50">
                {/* Font Size + Weight row */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="space-y-0.5">
                    <label className="text-[7px] text-neutral-500 font-mono">Size</label>
                    <input
                      type="number"
                      min={8}
                      max={120}
                      value={textStyle.fontSize || 24}
                      onChange={(e) => onTextStyleChange({ fontSize: parseInt(e.target.value) || 24 })}
                      title={`Tamaño: ${textStyle.fontSize || 24}px`}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] text-white text-center font-mono focus:border-violet-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[7px] text-neutral-500 font-mono">Weight</label>
                    <select
                      value={textStyle.fontWeight || 400}
                      onChange={(e) => onTextStyleChange({ fontWeight: parseInt(e.target.value) })}
                      title="Peso de fuente"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1 py-1 text-[10px] text-white font-mono focus:border-violet-500/50 focus:outline-none"
                    >
                      <option value={300}>Light</option>
                      <option value={400}>Normal</option>
                      <option value={600}>Semi</option>
                      <option value={700}>Bold</option>
                      <option value={900}>Black</option>
                    </select>
                  </div>
                </div>

                {/* Font Picker */}
                <div className="space-y-0.5">
                  <label className="text-[7px] text-neutral-500 font-mono">Fuente</label>
                  <FontPicker
                    value={textStyle.fontFamily || 'Inter'}
                    onChange={(font) => onTextStyleChange({ fontFamily: font })}
                    brandFont={brandFont}
                  />
                </div>

                {/* Color */}
                <div className="space-y-0.5">
                  <label className="text-[7px] text-neutral-500 font-mono">Color</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={textStyle.color || '#ffffff'}
                      onChange={(e) => onTextStyleChange({ color: e.target.value })}
                      title="Color del texto"
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border border-neutral-700 p-0"
                    />
                    <span className="text-[8px] text-neutral-500 font-mono">{textStyle.color || '#ffffff'}</span>
                    {/* Brand color quick-picks */}
                    {brandColors.length > 0 && (
                      <div className="flex gap-0.5 ml-auto">
                        {brandColors.map((c, i) => (
                          <button
                            key={`${c}-${i}`}
                            onClick={() => onTextStyleChange({ color: c })}
                            title={c}
                            className="w-4 h-4 rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[7px] text-neutral-500 font-mono">Opacidad</label>
                    <span className="text-[7px] text-neutral-600 font-mono">{Math.round((textStyle.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((textStyle.opacity ?? 1) * 100)}
                    onChange={(e) => onTextStyleChange({ opacity: Number(e.target.value) / 100 })}
                    title="Opacidad del texto"
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>
              </div>
            )}

          </div>
        </Section>
      )}
    </div>
  );
};
