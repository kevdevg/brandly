import { ExpressTemplate, ExpressScene, ExpressField, DesignMD, TimelineElement, TimelineLayer, TransitionType, CompanyProfile, BrandContentPiece } from '../types';

/**
 * Resolves brand variable placeholders in field values.
 * Uses CompanyProfile for social handles, tagline, etc.
 * Uses DesignMD for visual brand properties.
 */
function resolveBrandValue(
  field: ExpressField,
  userValue: string,
  designMD: DesignMD,
  company?: CompanyProfile,
  brandContent?: BrandContentPiece[],
): string {
  if (userValue && userValue.trim()) return userValue;

  // Resolve from brand asset ID (e.g. a logo badge piece)
  if (field.brandAssetId && brandContent) {
    const asset = brandContent.find(a => a.id === field.brandAssetId);
    if (asset) {
      // For images, return the thumbnail/image URL
      if (asset.content.imageUrl) return asset.content.imageUrl;
      if (asset.thumbnail) return asset.thumbnail;
      // For text cards, return the text
      if (asset.content.text) return asset.content.text;
    }
  }

  // Auto-resolve from brand source
  if (field.brandSource) {
    switch (field.brandSource) {
      case 'brand-name': return company?.name || designMD.brandName || 'Tu Marca';
      case 'tagline': return company?.tagline || '';
      case 'logo': return designMD.logoUrl || '';
      case 'intro-video': return designMD.introVideoUrl || '';
      case 'outro-video': return designMD.outroVideoUrl || '';
      case 'primary-color': return designMD.primaryColor;
      case 'secondary-color': return designMD.secondaryColor;
      // Social handles
      case 'instagram': return company?.socialLinks?.instagram || '';
      case 'tiktok': return company?.socialLinks?.tiktok || '';
      case 'twitter': return company?.socialLinks?.x || '';
      case 'youtube': return company?.socialLinks?.youtube || '';
      case 'website': return company?.socialLinks?.website || '';
    }
  }

  // Use placeholder (removing brand variable markers)
  return field.placeholder.replace(/\{[^}]+\}/g, company?.name || designMD.brandName || '');
}

/** Resolve a field's color from brand palette */
function resolveColor(field: ExpressField, designMD: DesignMD): string {
  if (field.style.color) return field.style.color;
  if (field.brandSource === 'primary-color') return designMD.primaryColor;
  return designMD.textColor || '#FFFFFF';
}

/** Resolve a field's font from brand config */
function resolveFont(field: ExpressField, designMD: DesignMD): string {
  if (field.style.fontSize && field.style.fontSize >= 28) {
    return designMD.titleFont || designMD.baseFont;
  }
  return designMD.paragraphFont || designMD.baseFont;
}

/**
 * Gets canvas dimensions for an aspect ratio.
 */
export function getAspectDimensions(aspect: string): { w: number; h: number } {
  switch (aspect) {
    case '9:16': return { w: 1080, h: 1920 };
    case '16:9': return { w: 1920, h: 1080 };
    case '1:1': return { w: 1080, h: 1080 };
    case '4:5': return { w: 1080, h: 1350 };
    case '4:3': return { w: 1440, h: 1080 };
    default: return { w: 1080, h: 1920 };
  }
}

/** Compute total duration of template in seconds */
export function getTemplateDuration(template: ExpressTemplate): number {
  return template.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
}

/**
 * Compiles a scene-based Express template into TimelineElement[].
 * Concatenates scenes sequentially, each scene contributing its fields as elements.
 */
export function compileExpressToTimeline(
  template: ExpressTemplate,
  fieldData: Record<string, string>,
  designMD: DesignMD,
  company?: CompanyProfile,
): { elements: TimelineElement[]; layers: TimelineLayer[] } {
  const fps = 30;
  const elements: TimelineElement[] = [];
  const layers: TimelineLayer[] = [
    { id: 'layer-express-bg', name: 'Fondos', type: 'visual', colorLabel: 'purple' },
    { id: 'layer-express-media', name: 'Media', type: 'visual', colorLabel: 'blue' },
    { id: 'layer-express-text', name: 'Textos', type: 'visual', colorLabel: 'orange' },
    { id: 'layer-express-brand', name: 'Marca', type: 'brand', colorLabel: 'yellow' },
  ];

  let frameOffset = 0;

  // Process each scene sequentially — the template's scenes are the sole source of truth
  for (const scene of template.scenes) {

    const sceneDurFrames = scene.durationSeconds * fps;
    const sceneStart = frameOffset;
    const sceneEnd = frameOffset + sceneDurFrames;

    // ── Handle intro/outro segments ──
    if ((scene.type === 'intro' || scene.type === 'outro') && scene.segmentSource) {
      const isIntro = scene.type === 'intro';

      if (scene.segmentSource === 'brand') {
        // Resolve video from DesignMD
        const videoUrl = isIntro ? designMD.introVideoUrl : designMD.outroVideoUrl;
        if (!videoUrl) {
          // Brand has no video for this segment — skip entirely
          // Don't advance frameOffset so it doesn't create a gap
          continue;
        }

        // Convert from center-based coords (SegmentVideoFrame) to top-left coords (CompositionElement)
        const segW = scene.segmentVideoW ?? 100;
        const segH = scene.segmentVideoH ?? 100;
        const segX = (scene.segmentVideoX ?? 50) - segW / 2;
        const segY = (scene.segmentVideoY ?? 50) - segH / 2;

        elements.push({
          id: `express-segment-${scene.id}`,
          type: 'video',
          content: videoUrl,
          x: segX,
          y: segY,
          startFrame: sceneStart,
          endFrame: sceneEnd,
          width: segW,
          height: segH,
          // CompositionElement's isFullscreenBrand path reads w/h (not width/height)
          w: segW,
          h: segH,
          objectFit: scene.segmentVideoFit || (isIntro
            ? (designMD.introVideoFit || 'cover')
            : (designMD.outroVideoFit || 'cover')) as 'cover' | 'contain' | 'fill',
          layerId: 'layer-express-bg',
          isBrandElement: true,
          isLocked: true,
          elementName: isIntro ? 'Intro de marca' : 'Outro de marca',
          scale: 1,
          rotation: 0,
          opacity: 100,
          transitionIn: scene.segmentTransition
            ? { type: scene.segmentTransition.type as TransitionType, duration: scene.segmentTransition.duration }
            : undefined,
        });
      } else if (scene.segmentSource === 'form') {
        // Form-sourced: look up the uploaded video from fieldData
        const segmentFieldId = `segment-${scene.id}`;
        const videoUrl = fieldData[segmentFieldId] || '';

        // Convert from center-based coords (SegmentVideoFrame) to top-left coords
        const fSegW = scene.segmentVideoW ?? 100;
        const fSegH = scene.segmentVideoH ?? 100;
        const fSegX = (scene.segmentVideoX ?? 50) - fSegW / 2;
        const fSegY = (scene.segmentVideoY ?? 50) - fSegH / 2;

        elements.push({
          id: `express-segment-${scene.id}`,
          type: 'video',
          content: videoUrl,
          x: fSegX,
          y: fSegY,
          startFrame: sceneStart,
          endFrame: sceneEnd,
          width: fSegW,
          height: fSegH,
          objectFit: (scene.segmentVideoFit || 'cover') as 'cover' | 'contain' | 'fill',
          layerId: 'layer-express-media',
          isBrandElement: false,
          isLocked: false,
          elementName: scene.segmentFieldLabel || (isIntro ? 'Video de intro' : 'Video de cierre'),
          sourceFieldId: segmentFieldId,
          scale: 1,
          rotation: 0,
          opacity: 100,
          // Show placeholder when no video uploaded
          ...(videoUrl ? {} : {
            isPlaceholder: true,
            placeholderLabel: scene.segmentFieldLabel || (isIntro ? 'Video de intro' : 'Video de cierre'),
          }),
          transitionIn: scene.segmentTransition
            ? { type: scene.segmentTransition.type as TransitionType, duration: scene.segmentTransition.duration }
            : undefined,
        });
      }

      frameOffset = sceneEnd;
      continue;
    }

    // Scene background (if brand type, use secondary color)
    if (scene.background) {
      const bgColor = scene.background.type === 'brand'
        ? designMD.secondaryColor
        : scene.background.type === 'gradient'
          ? designMD.primaryColor
          : (scene.background.value || designMD.secondaryColor);

      elements.push({
        id: `express-bg-${scene.id}`,
        type: 'shape',
        content: '',
        x: 50, y: 50,
        startFrame: sceneStart,
        endFrame: sceneEnd,
        scale: 1, rotation: 0, opacity: 100,
        layerId: 'layer-express-bg',
        isBrandElement: false,
        isLocked: false,
        elementName: `Fondo: ${scene.name}`,
        color: bgColor,
        width: 100,
        height: 100,
        shapeType: 'rectangle',
        transitionIn: scene.transition ? { type: scene.transition.type as TransitionType, duration: scene.transition.duration } : undefined,
      });
    }

    // Process fields — prefer new TemplateField[] format over legacy editableFields
    const fieldsToProcess = (scene.fields && scene.fields.length > 0)
      ? scene.fields
      : null;

    if (fieldsToProcess) {
      // New TemplateField[] format: process ALL natures
      for (const field of fieldsToProcess) {
        let value: string;

        if (field.nature === 'static') {
          // Static: always use the fixed content
          value = field.content || '';
        } else if (field.nature === 'brand-variable') {
          // Brand variable: auto-resolve from DesignMD/CompanyProfile
          const legacyField: ExpressField = {
            id: field.id, type: field.type === 'video' ? 'media' : field.type === 'image' ? (field.brandSource === 'logo' ? 'logo' : 'media') : field.type as ExpressField['type'],
            label: field.label, placeholder: field.content, required: field.required,
            brandSource: field.brandSource, brandAssetId: field.brandAssetId,
            position: field.position, style: field.style as ExpressField['style'],
          };
          value = resolveBrandValue(legacyField, '', designMD, company, company?.brandContent);
        } else {
          // Editable slot: use user-provided data, or fallback to content
          const legacyField: ExpressField = {
            id: field.id, type: field.type === 'video' ? 'media' : field.type === 'image' ? 'media' : field.type as ExpressField['type'],
            label: field.label, placeholder: field.content, required: field.required,
            brandSource: field.brandSource, brandAssetId: field.brandAssetId,
            position: field.position, style: field.style as ExpressField['style'],
          };
          value = resolveBrandValue(legacyField, fieldData[field.id] || '', designMD, company, company?.brandContent);
        }

        // For media fields, resolveBrandValue may return placeholder TEXT (e.g. "Foto o gráfico")
        // which is NOT a valid URL. Detect and treat as empty to avoid crashing Remotion's <Img>.
        const isMediaField = field.type === 'image' || field.type === 'video';
        if (isMediaField && value && !/^(https?:|blob:|data:|\/)/i.test(value)) {
          value = '';
        }
        if (!value && !isMediaField) continue;

        const elType = field.type === 'text' || field.type === 'sticker' ? 'text'
          : field.type === 'shape' ? 'shape'
          : field.type === 'video' ? 'video'
          : 'image';

        // For stickers, format the text with @ prefix and strip URLs
        let compiledContent = value;
        if (field.type === 'sticker' && field.style.sticker) {
          const st = field.style.sticker;
          if (st.showAtPrefix && field.brandSource !== 'website') {
            compiledContent = `@${value.replace(/^@/, '')}`;
          } else if (field.brandSource === 'website') {
            compiledContent = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
          }
        }

        const layerId = field.type === 'text' ? 'layer-express-text'
          : field.nature === 'brand-variable' ? 'layer-express-brand'
          : 'layer-express-media';

        const isEmptyMedia = isMediaField && !value;

        elements.push({
          id: `express-${scene.id}-${field.id}`,
          sourceFieldId: field.id,
          type: elType,
          content: field.type === 'sticker' ? compiledContent : (value || ''),
          x: field.position.x,
          y: field.position.y,
          startFrame: sceneStart,
          endFrame: sceneEnd,
          scale: 1,
          rotation: field.position.rotation || 0,
          opacity: field.style.opacity ?? 100,
          layerId,
          isBrandElement: field.nature === 'brand-variable',
          isLocked: field.nature === 'static',
          elementName: field.label,
          // Placeholder mode for empty media fields
          ...(isEmptyMedia ? {
            isPlaceholder: true,
            placeholderLabel: field.label,
          } : {}),
          ...(field.type === 'text' || field.type === 'sticker' ? {
            fontSize: field.style.fontSize || (field.type === 'sticker' ? 14 : 24),
            fontWeight: field.style.fontWeight || (field.type === 'sticker' ? 500 : 400),
            fontFamily: field.style.fontFamily || designMD.baseFont,
            color: field.style.color || designMD.textColor || '#FFFFFF',
            textAlign: (field.style.textAlign as 'left' | 'center' | 'right') || (field.type === 'sticker' ? 'left' : 'center'),
          } : {}),
          ...(field.type === 'image' || field.type === 'video' ? {
            width: field.position.w,
            height: field.position.h,
            objectFit: (field.style.mediaFit || 'cover') as 'cover' | 'contain' | 'fill',
          } : {}),
          ...(field.type === 'shape' ? {
            width: field.position.w,
            height: field.position.h,
            shapeType: field.style.shapeType || 'rectangle',
            color: field.style.shapeFill || designMD.primaryColor,
          } : {}),
          transitionIn: scene.transition ? { type: scene.transition.type as TransitionType, duration: scene.transition.duration } : undefined,
        });
      }
    } else {
      // Legacy ExpressField[] format
      for (const field of scene.editableFields) {
        let value = resolveBrandValue(field, fieldData[field.id] || '', designMD, company, company?.brandContent);
        // For media fields, placeholder text is not a valid URL — clear it to avoid crashing Remotion
        const isLegacyMedia = field.type === 'media' || field.type === 'logo';
        if (isLegacyMedia && value && !/^(https?:|blob:|data:|\/)/i.test(value)) {
          value = '';
        }
        // Skip non-media fields with no resolved value; media fields get a placeholder
        if (!value && !isLegacyMedia) continue;

        const elType = field.type === 'text' ? 'text'
          : field.type === 'logo' ? 'image'
          : 'image';

        const layerId = field.type === 'text' ? 'layer-express-text'
          : field.type === 'logo' ? 'layer-express-brand'
          : 'layer-express-media';

        const isEmptyMedia = isLegacyMedia && !value;

        elements.push({
          id: `express-${scene.id}-${field.id}`,
          sourceFieldId: field.id,
          type: elType,
          content: value || '',
          x: field.position.x,
          y: field.position.y,
          startFrame: sceneStart,
          endFrame: sceneEnd,
          scale: 1,
          rotation: 0,
          opacity: field.style.opacity ?? 100,
          layerId,
          isBrandElement: field.type === 'logo',
          isLocked: false,
          elementName: field.label,
          // Placeholder mode for empty media fields
          ...(isEmptyMedia ? {
            isPlaceholder: true,
            placeholderLabel: field.label,
          } : {}),
          ...(field.type === 'text' ? {
            fontSize: field.style.fontSize || 24,
            fontWeight: field.style.fontWeight || 400,
            fontFamily: resolveFont(field, designMD),
            color: resolveColor(field, designMD),
            textAlign: (field.style.textAlign as 'left' | 'center' | 'right') || 'center',
            width: field.position.w,
          } : {}),
          ...(field.type === 'media' || field.type === 'logo' ? {
            width: field.position.w,
            height: field.position.h,
            objectFit: 'cover' as const,
          } : {}),
          transitionIn: scene.transition ? { type: scene.transition.type as TransitionType, duration: scene.transition.duration } : undefined,
        });
      }
    }

    frameOffset = sceneEnd;
  }

  return { elements, layers };
}
