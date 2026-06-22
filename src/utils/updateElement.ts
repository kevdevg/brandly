import { TimelineElement } from '../types';

/**
 * Immutably update a single timeline element by ID.
 * Returns a new array with the updated element — never mutates the original.
 */
export function updateElement(
  elements: TimelineElement[],
  id: string,
  updates: Partial<TimelineElement>
): TimelineElement[] {
  return elements.map(el =>
    el.id === id ? { ...el, ...updates } : el
  );
}

/**
 * Immutably update a timeline element at a specific index.
 * Returns a new array — never mutates the original.
 */
export function updateElementAtIndex(
  elements: TimelineElement[],
  index: number,
  updates: Partial<TimelineElement>
): TimelineElement[] {
  return elements.map((el, i) =>
    i === index ? { ...el, ...updates } : el
  );
}

/**
 * Immutably delete transition properties from an element by ID.
 */
export function updateElementTransition(
  elements: TimelineElement[],
  id: string,
  field: 'transitionIn' | 'transitionOut',
  value: TimelineElement['transitionIn'] | undefined
): TimelineElement[] {
  return elements.map(el => {
    if (el.id !== id) return el;
    const updated = { ...el };
    if (value === undefined) {
      delete updated[field];
    } else {
      updated[field] = value;
    }
    return updated;
  });
}

/**
 * Immutably update keyframe properties on an element, supporting delete.
 */
export function updateElementKeyframes(
  elements: TimelineElement[],
  index: number,
  enabled: boolean,
  currentEl: TimelineElement
): TimelineElement[] {
  return elements.map((el, i) => {
    if (i !== index) return el;
    if (enabled) {
      return {
        ...el,
        animEndX: currentEl.x,
        animEndY: currentEl.y,
        animEndScale: currentEl.scale ?? 1,
        animEndOpacity: 100,
      };
    } else {
      const { animEndX, animEndY, animEndScale, animEndOpacity, ...rest } = el;
      return rest as TimelineElement;
    }
  });
}
