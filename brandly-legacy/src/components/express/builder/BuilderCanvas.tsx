import React, { useRef, useCallback, useMemo } from 'react';
import {
  Type, Image as ImageIcon, Video, Pentagon, Zap, Move, Maximize2,
  Upload, Film,
} from 'lucide-react';
import { TemplateField, TemplateFieldNature, DesignMD, CompanyProfile, StickerConfig } from '../../../types';
import { getAspectDimensions } from '../../../utils/expressCompiler';
import { useDragResize } from '../../../hooks/useDragResize';
import { useTemplateBuilder } from '../../../context/TemplateBuilderContext';
import { getPlatformIcon, isSocialSource, DEFAULT_STICKER } from './PlatformIcons';
import { resolveBrandRole } from '../../ui/FieldInspector';
import { SegmentVideoFrame } from './SegmentVideoFrame';

/** Get type icon */
function getTypeIcon(type: TemplateField['type'], size = 14): React.ReactNode {
  switch (type) {
    case 'text': return <Type size={size} />;
    case 'image': return <ImageIcon size={size} />;
    case 'video': return <Video size={size} />;
    case 'shape': return <Pentagon size={size} />;
    case 'sticker': return <Zap size={size} />;
  }
}

/** Nature colors */
const NATURE_COLORS: Record<TemplateFieldNature, { border: string; bg: string; text: string; badge: string }> = {
  'static': {
    border: 'rgba(107, 114, 128, 0.4)',
    bg: 'rgba(107, 114, 128, 0.08)',
    text: '#9ca3af',
    badge: '#6b7280',
  },
  'brand-variable': {
    border: 'rgba(167, 139, 250, 0.5)',
    bg: 'rgba(167, 139, 250, 0.08)',
    text: '#c4b5fd',
    badge: '#a78bfa',
  },
  'editable-slot': {
    border: 'rgba(56, 189, 248, 0.5)',
    bg: 'rgba(56, 189, 248, 0.06)',
    text: '#7dd3fc',
    badge: '#38bdf8',
  },
};

/** Resolve brand variable to preview text */
function resolveBrandPreview(field: TemplateField, designMD: DesignMD, company: CompanyProfile): string {
  if (field.nature !== 'brand-variable' || !field.brandSource) return field.content;

  switch (field.brandSource) {
    case 'brand-name': return company.name || designMD.brandName || 'Tu Marca';
    case 'tagline': return company.tagline || 'Tu eslogan';
    case 'logo': return designMD.logoUrl || '';
    case 'instagram': return company.socialLinks?.instagram || '@instagram';
    case 'tiktok': return company.socialLinks?.tiktok || '@tiktok';
    case 'twitter': return company.socialLinks?.x || '@x';
    case 'youtube': return company.socialLinks?.youtube || 'YouTube';
    case 'website': return company.socialLinks?.website || 'www.example.com';
    default: return field.content;
  }
}

/**
 * BuilderCanvas — Interactive canvas for the Template Builder.
 *
 * Renders TemplateField[] directly with visual differentiation by nature:
 * - static: solid border, rendered content, no badge
 * - brand-variable: dotted violet border, real preview data, "auto" badge
 * - editable-slot: dashed blue border, placeholder zone with icon + label, "campo" badge
 *
 * Uses the shared `useDragResize` hook for all pointer interactions (per AGENTS.md).
 */
export const BuilderCanvas: React.FC = () => {
  const {
    fields,
    updateField,
    selectedFieldId,
    setSelectedFieldId,
    designMD,
    company,
    templateMeta,
    activeScene,
    updateSegment,
    previewBrand,
  } = useTemplateBuilder();

  // Detect segment mode: active scene is an intro/outro with segmentSource
  const isSegmentMode = !!(activeScene?.segmentSource);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Shared drag/resize hook ──
  const {
    startDrag,
    startResize,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    activeId: dragFieldId,
    snapGuides,
  } = useDragResize({
    containerRef: containerRef as React.RefObject<HTMLElement>,
    onMove: useCallback((id: string, x: number, y: number) => {
      const field = fields.find(f => f.id === id);
      if (!field) return;
      updateField(id, { position: { ...field.position, x, y } });
    }, [fields, updateField]),
    onResize: useCallback((id: string, w: number, h: number) => {
      const field = fields.find(f => f.id === id);
      if (!field) return;
      updateField(id, { position: { ...field.position, w, h } });
    }, [fields, updateField]),
    snapLines: [50],
    snapThreshold: 1.5,
  });

  const dimensions = getAspectDimensions(templateMeta.aspectRatio);

  // Resolve background
  const bgColor = useMemo(() => {
    const bg = activeScene?.background;
    if (!bg) return designMD.secondaryColor;
    switch (bg.type) {
      case 'brand': return designMD.secondaryColor;
      case 'solid': return bg.value || '#1a1a1a';
      case 'gradient': return undefined;
      case 'media': return '#111';
      default: return designMD.secondaryColor;
    }
  }, [activeScene, designMD]);

  const bgGradient = activeScene?.background?.type === 'gradient'
    ? `linear-gradient(135deg, ${designMD.primaryColor} 0%, ${designMD.secondaryColor} 100%)`
    : undefined;

  const handleCanvasClick = useCallback(() => {
    if (!isDragging) setSelectedFieldId(null);
  }, [isDragging, setSelectedFieldId]);

  // In segment mode, render SegmentVideoFrame instead of normal fields
  if (isSegmentMode && activeScene) {
    return (
      <SegmentVideoFrame
        scene={activeScene}
        designMD={designMD}
        previewBrand={previewBrand}
        aspectRatio={templateMeta.aspectRatio}
        onPositionChange={(updates) => updateSegment(activeScene.id, updates)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-4 overflow-hidden relative min-h-0">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}
      />

      {/* Canvas wrapper */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-neutral-800/40 select-none shrink-0"
        style={{
          ...(templateMeta.aspectRatio === '9:16' || templateMeta.aspectRatio === '4:5'
            ? { height: 'calc(100% - 40px)', maxWidth: '90%' }
            : {
                width: templateMeta.aspectRatio === '1:1' ? 360 : 440,
                maxHeight: 'calc(100% - 40px)',
              }),
          aspectRatio: `${dimensions.w} / ${dimensions.h}`,
          backgroundColor: bgColor,
          backgroundImage: bgGradient,
        }}
        onPointerDown={handleCanvasClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Snap guides */}
        {snapGuides.x !== undefined && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-50"
            style={{ left: `${snapGuides.x}%`, width: '1px', background: 'rgba(139, 92, 246, 0.5)', borderLeft: '1px dashed rgba(139, 92, 246, 0.6)' }}
          />
        )}
        {snapGuides.y !== undefined && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-50"
            style={{ top: `${snapGuides.y}%`, height: '1px', background: 'rgba(139, 92, 246, 0.5)', borderTop: '1px dashed rgba(139, 92, 246, 0.6)' }}
          />
        )}

        {/* Center crosshair (subtle) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.03] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.03] pointer-events-none z-0" />

        {/* ── Render fields ── */}
        {fields.map((field, idx) => {
          // Skip hidden layers
          if (field.visible === false) return null;

          const isSelected = selectedFieldId === field.id;
          const isDraggingField = dragFieldId === field.id;
          const isLocked = field.locked === true;
          const colors = NATURE_COLORS[field.nature];

          return (
            <div
              key={field.id}
              className="absolute transition-shadow"
              style={{
                left: `${field.position.x - field.position.w / 2}%`,
                top: `${field.position.y - field.position.h / 2}%`,
                width: `${field.position.w}%`,
                height: `${field.position.h}%`,
                transform: field.position.rotation ? `rotate(${field.position.rotation}deg)` : undefined,
                // z-index from array position: index 0 = back, last = front
                // Dragging/selected get temporary boost to stay on top during interaction
                zIndex: isDraggingField ? 1000 : isSelected ? 999 : idx + 1,
              }}
            >
              {/* Field box */}
              <div
                className={`w-full h-full rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                } ${isDraggingField ? 'scale-[1.02] shadow-xl' : ''}`}
                style={{
                  backgroundColor: isSelected ? `${colors.badge}20` : colors.bg,
                  border: `${field.nature === 'editable-slot' ? '2px dashed' : field.nature === 'brand-variable' ? '1px dotted' : '1px solid'} ${
                    isSelected ? colors.badge : colors.border
                  }`,
                  outline: isSelected ? `2px solid ${colors.badge}60` : undefined,
                  outlineOffset: isSelected ? '2px' : undefined,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isLocked) return; // Can't interact with locked layers
                  setSelectedFieldId(field.id);
                  startDrag(e, field.id, field.position);
                }}
              >
                {/* ── Nature-specific content ── */}
                {field.nature === 'static' && (
                  <StaticFieldContent field={field} designMD={designMD} />
                )}
                {field.nature === 'brand-variable' && (
                  <BrandVariableContent field={field} designMD={designMD} company={company} />
                )}
                {field.nature === 'editable-slot' && (
                  <EditableSlotContent field={field} />
                )}

                {/* ── Badge (brand-variable and editable-slot) ── */}
                {field.nature !== 'static' && (
                  <div
                    className="absolute -top-2.5 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider pointer-events-none"
                    style={{
                      backgroundColor: `${colors.badge}20`,
                      color: colors.badge,
                      border: `1px solid ${colors.badge}40`,
                    }}
                  >
                    {field.nature === 'brand-variable' ? (
                      <><Zap size={7} /> auto</>
                    ) : (
                      <>{getTypeIcon(field.type, 7)} {field.label}</>
                    )}
                  </div>
                )}

                {/* Position readout when selected */}
                {isSelected && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[7px] text-violet-300/60 font-mono whitespace-nowrap pointer-events-none">
                    <Move size={7} /> {field.position.x.toFixed(0)},{field.position.y.toFixed(0)}
                    <Maximize2 size={7} className="ml-1" /> {field.position.w.toFixed(0)}×{field.position.h.toFixed(0)}
                  </div>
                )}
              </div>

              {/* Resize handle */}
              {isSelected && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-2 border-neutral-900 rounded-sm cursor-nwse-resize z-40 hover:opacity-80 transition-colors"
                  style={{ backgroundColor: colors.badge }}
                  onPointerDown={(e) => startResize(e, field.id, field.position)}
                  title="Redimensionar campo"
                />
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {fields.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] text-white/20 text-center">
              Agrega campos desde el panel izquierdo<br />
              para posicionarlos aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ Nature-specific content renderers ═══

/** Static: show actual content/shape */
const StaticFieldContent: React.FC<{ field: TemplateField; designMD: DesignMD }> = ({ field, designMD }) => {
  if (field.type === 'text') {
    // Resolve brand typography if useBrandStyle is active
    const brandStyle = (field.style.useBrandStyle !== false && field.style.textRole)
      ? resolveBrandRole(designMD, field.style.textRole)
      : null;
    return (
      <span
        className="pointer-events-none text-center px-1 truncate w-full"
        style={{
          fontSize: `${Math.min(brandStyle?.fontSize || field.style.fontSize || 16, 20)}px`,
          fontWeight: brandStyle?.fontWeight || field.style.fontWeight || 400,
          fontFamily: brandStyle?.fontFamily || field.style.fontFamily || designMD.baseFont,
          color: brandStyle?.color || field.style.color || designMD.textColor || '#ffffff',
          opacity: (field.style.opacity ?? 100) / 100,
        }}
      >
        {field.content || 'Texto estático'}
      </span>
    );
  }

  if (field.type === 'shape') {
    return (
      <div
        className="w-full h-full rounded pointer-events-none"
        style={{
          backgroundColor: field.style.shapeFill || designMD.primaryColor,
          borderRadius: field.style.shapeCornerRadius ? `${field.style.shapeCornerRadius}px` : undefined,
          opacity: (field.style.opacity ?? 100) / 100,
        }}
      />
    );
  }

  // image or video static
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none" style={{ color: '#6b7280' }}>
      {getTypeIcon(field.type, 16)}
      <span className="text-[7px] font-mono">{field.type}</span>
    </div>
  );
};

/** Brand variable: show real preview with brand styling */
const BrandVariableContent: React.FC<{ field: TemplateField; designMD: DesignMD; company: CompanyProfile }> = ({ field, designMD, company }) => {
  const preview = resolveBrandPreview(field, designMD, company);

  // Logo: show image
  if (field.brandSource === 'logo' && designMD.logoUrl) {
    return (
      <img
        src={designMD.logoUrl}
        alt="Logo"
        className="max-w-full max-h-full object-contain pointer-events-none p-1"
        style={{ opacity: (field.style.opacity ?? 100) / 100 }}
      />
    );
  }

  // Sticker: icon + text composite
  if (field.type === 'sticker') {
    return <BrandStickerContent field={field} designMD={designMD} company={company} />;
  }

  // Text brand variable: show with brand font
  const brandStyle = (field.style.useBrandStyle !== false && field.style.textRole)
    ? resolveBrandRole(designMD, field.style.textRole)
    : null;
  return (
    <span
      className="pointer-events-none text-center px-1 truncate w-full"
      style={{
        fontSize: `${Math.min(brandStyle?.fontSize || field.style.fontSize || 16, 18)}px`,
        fontWeight: brandStyle?.fontWeight || field.style.fontWeight || 400,
        fontFamily: brandStyle?.fontFamily || field.style.fontFamily || designMD.baseFont,
        color: brandStyle?.color || field.style.color || '#c4b5fd',
        opacity: (field.style.opacity ?? 100) / 100,
      }}
    >
      {preview}
    </span>
  );
};

/** Brand Sticker: icon + text as a single visual unit */
const BrandStickerContent: React.FC<{ field: TemplateField; designMD: DesignMD; company: CompanyProfile }> = ({ field, designMD, company }) => {
  const sticker: StickerConfig = field.style.sticker || DEFAULT_STICKER;
  const rawValue = resolveBrandPreview(field, designMD, company);

  // Format display text
  const displayText = sticker.showAtPrefix && isSocialSource(field.brandSource) && field.brandSource !== 'website'
    ? `@${rawValue.replace(/^@/, '')}`
    : field.brandSource === 'website'
      ? rawValue.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : rawValue;

  const iconSize = Math.min(Math.max((field.style.fontSize || 14) * 0.9, 10), 18);
  const icon = sticker.showIcon ? getPlatformIcon(field.brandSource, iconSize) : null;

  const isPill = sticker.stickerStyle === 'pill';

  return (
    <div
      className={`flex items-center pointer-events-none w-full h-full justify-center ${
        isPill ? 'px-2' : 'px-1'
      }`}
    >
      <div
        className={`flex items-center ${
          isPill ? 'bg-white/10 rounded-full px-3 py-1' : ''
        }`}
        style={{
          gap: `${sticker.gap}px`,
          flexDirection: sticker.iconPosition === 'right' ? 'row-reverse' : 'row',
        }}
      >
        {icon && (
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ color: sticker.iconColor || designMD.primaryColor }}
          >
            {icon}
          </span>
        )}
        <span
          className="truncate"
          style={{
            fontSize: `${Math.min(field.style.fontSize || 14, 16)}px`,
            fontWeight: field.style.fontWeight || 500,
            fontFamily: field.style.fontFamily || designMD.baseFont,
            color: field.style.color || '#c4b5fd',
            opacity: (field.style.opacity ?? 100) / 100,
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
};

/** Editable slot: show placeholder zone */
const EditableSlotContent: React.FC<{ field: TemplateField }> = ({ field }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 pointer-events-none w-full h-full">
      <div style={{ color: '#7dd3fc' }}>
        {field.type === 'text' && <Type size={16} />}
        {field.type === 'image' && <Upload size={16} />}
        {field.type === 'video' && <Film size={16} />}
        {field.type === 'shape' && <Pentagon size={16} />}
      </div>
      <span className="text-[8px] text-sky-300/60 font-medium truncate max-w-[90%] text-center">
        {field.label}
      </span>
      {field.required && (
        <span className="text-[6px] text-red-400/60 font-bold">OBLIGATORIO</span>
      )}
    </div>
  );
};
