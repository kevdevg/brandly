import { ExpressField, ExpressScene, TimelineElement } from '../types';

const FPS = 30;

/**
 * Convert ExpressField[] from a scene into TimelineElement[] for use in EditorContext.
 * This lets the Template Builder use the Studio's full rendering and editing stack.
 */
export function fieldsToElements(
  scene: ExpressScene,
  layerId: string = 'layer-1',
): TimelineElement[] {
  const durationFrames = (scene.durationSeconds || 5) * FPS;

  return scene.editableFields.map((field): TimelineElement => {
    const base: TimelineElement = {
      id: field.id,
      layerId,
      type: fieldTypeToElementType(field.type),
      content: field.placeholder || field.label,
      startFrame: 0,
      endFrame: durationFrames,
      x: field.position.x,
      y: field.position.y,
      width: field.position.w,
      height: field.position.h,
      fontSize: field.style.fontSize,
      fontWeight: field.style.fontWeight,
      color: field.style.color,
      textAlign: field.style.textAlign as TimelineElement['textAlign'],
      opacity: field.style.opacity, // Both use 0-100 scale
      elementName: field.label,
      // Shape-specific properties
      shapeType: field.style.shapeType,
      shapeFill: field.style.shapeFill,
      shapeStroke: field.style.shapeStroke,
      shapeStrokeWidth: field.style.shapeStrokeWidth,
      shapeCornerRadius: field.style.shapeCornerRadius,
    };

    // Preserve brand metadata as notes for round-trip
    if (field.brandSource || field.brandAssetId) {
      base.notes = JSON.stringify({
        __expressField: true,
        brandSource: field.brandSource,
        brandAssetId: field.brandAssetId,
        required: field.required,
        fieldType: field.type,
      });
    }

    return base;
  });
}

/**
 * Convert TimelineElement[] back to ExpressField[] for serialization as ExpressTemplate.
 * Preserves brand metadata stored in element.notes.
 */
export function elementsToFields(elements: TimelineElement[]): ExpressField[] {
  return elements
    .filter(el => !el.isBrandElement) // Don't export brand-injected elements
    .map((el): ExpressField => {
      // Recover brand metadata from notes if present
      let brandMeta: {
        brandSource?: ExpressField['brandSource'];
        brandAssetId?: string;
        required?: boolean;
        fieldType?: ExpressField['type'];
      } = {};

      if (el.notes) {
        try {
          const parsed = JSON.parse(el.notes);
          if (parsed.__expressField) {
            brandMeta = parsed;
          }
        } catch { /* not JSON, ignore */ }
      }

      return {
        id: el.id,
        type: brandMeta.fieldType || elementTypeToFieldType(el.type),
        label: el.elementName || el.content?.slice(0, 30) || 'Campo',
        placeholder: el.content || '',
        required: brandMeta.required ?? false,
        brandSource: brandMeta.brandSource,
        brandAssetId: brandMeta.brandAssetId,
        position: {
          x: el.x,
          y: el.y,
          w: el.width ?? 30,
          h: el.height ?? 10,
        },
        style: {
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          textAlign: el.textAlign,
          color: el.color,
          opacity: el.opacity, // Both use 0-100 scale
          fontFamily: el.fontFamily,
          // Shape-specific properties
          shapeType: el.shapeType,
          shapeFill: el.shapeFill,
          shapeStroke: el.shapeStroke,
          shapeStrokeWidth: el.shapeStrokeWidth,
          shapeCornerRadius: el.shapeCornerRadius,
        },
      };
    });
}

/**
 * Convert all scenes' fields to elements, keyed by sceneId.
 * Used when loading an existing template for editing.
 */
export function templateToSceneElements(
  scenes: ExpressScene[],
  layerId: string = 'layer-1',
): Record<string, TimelineElement[]> {
  const result: Record<string, TimelineElement[]> = {};
  for (const scene of scenes) {
    result[scene.id] = fieldsToElements(scene, layerId);
  }
  return result;
}

// ── Helpers ──

function fieldTypeToElementType(type: ExpressField['type']): TimelineElement['type'] {
  switch (type) {
    case 'text': return 'text';
    case 'media': return 'image';
    case 'logo': return 'image';
    case 'shape': return 'shape';
    default: return 'text';
  }
}

function elementTypeToFieldType(type: TimelineElement['type']): ExpressField['type'] {
  switch (type) {
    case 'text': return 'text';
    case 'image':
    case 'video':
    case 'sticker': return 'media';
    case 'shape': return 'shape';
    case 'color': return 'media';
    default: return 'text';
  }
}
