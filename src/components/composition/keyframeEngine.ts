import { interpolate, Easing } from 'remotion';
import { AnimationKeyframe, EasingType } from '../../types';

interface KeyframeDefaults {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
}

interface ResolvedValues {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
}

/**
 * Map EasingType to a Remotion Easing function.
 */
function getEasingFn(type: EasingType = 'linear'): (t: number) => number {
  switch (type) {
    case 'ease-in': return Easing.in(Easing.ease);
    case 'ease-out': return Easing.out(Easing.ease);
    case 'ease-in-out': return Easing.inOut(Easing.ease);
    case 'bounce': return Easing.bounce;
    case 'spring': return Easing.out(Easing.ease); // Approximation — spring is better via spring()
    case 'linear':
    default: return Easing.linear;
  }
}

/**
 * Build a filled property array from keyframes.
 * If a keyframe doesn't define a property, it inherits the previous keyframe's value.
 */
function buildPropertyTrack(
  sortedKfs: AnimationKeyframe[],
  property: keyof Omit<AnimationKeyframe, 'frame' | 'easing'>,
  defaultValue: number
): number[] {
  let lastValue = defaultValue;
  return sortedKfs.map(kf => {
    const v = kf[property];
    if (v !== undefined) {
      lastValue = v;
      return v;
    }
    return lastValue;
  });
}

/**
 * Resolve multi-keyframe interpolation for a given frame.
 *
 * @param keyframes - Array of keyframes (will be sorted by frame)
 * @param frame     - Current absolute frame number
 * @param defaults  - Default values for all properties (used before the first keyframe)
 * @returns Interpolated property values at the given frame
 */
export function resolveKeyframes(
  keyframes: AnimationKeyframe[],
  frame: number,
  defaults: KeyframeDefaults
): ResolvedValues {
  if (keyframes.length === 0) return { ...defaults };

  // Sort by frame
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  // If only one keyframe, return its values (no interpolation)
  if (sorted.length === 1) {
    const kf = sorted[0];
    return {
      x: kf.x ?? defaults.x,
      y: kf.y ?? defaults.y,
      scale: kf.scale ?? defaults.scale,
      opacity: kf.opacity ?? defaults.opacity,
      rotation: kf.rotation ?? defaults.rotation,
    };
  }

  // Build frame array (inputRange)
  const frames = sorted.map(kf => kf.frame);

  // Build easing array (one per segment = keyframes.length - 1)
  const easings = sorted.slice(1).map(kf => getEasingFn(kf.easing));

  // Build and interpolate each property
  const interpolateProperty = (
    property: keyof Omit<AnimationKeyframe, 'frame' | 'easing'>,
    defaultValue: number
  ): number => {
    const values = buildPropertyTrack(sorted, property, defaultValue);
    return interpolate(frame, frames, values, {
      easing: easings as ((t: number) => number)[],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return {
    x: interpolateProperty('x', defaults.x),
    y: interpolateProperty('y', defaults.y),
    scale: interpolateProperty('scale', defaults.scale),
    opacity: interpolateProperty('opacity', defaults.opacity),
    rotation: interpolateProperty('rotation', defaults.rotation),
  };
}

/**
 * Find the keyframe at a specific frame (within ±tolerance).
 */
export function findKeyframeAtFrame(
  keyframes: AnimationKeyframe[],
  frame: number,
  tolerance: number = 2
): { index: number; keyframe: AnimationKeyframe } | null {
  for (let i = 0; i < keyframes.length; i++) {
    if (Math.abs(keyframes[i].frame - frame) <= tolerance) {
      return { index: i, keyframe: keyframes[i] };
    }
  }
  return null;
}

/**
 * Add or update a keyframe at a specific frame.
 * If a keyframe exists within ±tolerance, update it. Otherwise, insert a new one.
 */
export function upsertKeyframe(
  keyframes: AnimationKeyframe[],
  frame: number,
  values: Partial<Omit<AnimationKeyframe, 'frame'>>,
  tolerance: number = 2
): AnimationKeyframe[] {
  const existing = findKeyframeAtFrame(keyframes, frame, tolerance);
  if (existing) {
    // Update existing keyframe
    return keyframes.map((kf, i) =>
      i === existing.index ? { ...kf, ...values } : kf
    );
  }
  // Insert new keyframe
  return [...keyframes, { frame, ...values }].sort((a, b) => a.frame - b.frame);
}

/**
 * Remove a keyframe at a specific index.
 */
export function removeKeyframe(
  keyframes: AnimationKeyframe[],
  index: number
): AnimationKeyframe[] {
  return keyframes.filter((_, i) => i !== index);
}
