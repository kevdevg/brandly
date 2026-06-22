/**
 * Chroma Key Utilities
 * 
 * Core pixel-processing algorithm for removing solid-color backgrounds
 * from images and video frames. Operates on Canvas 2D ImageData.
 */

export interface ChromaKeyParams {
  /** RGB tuple of the key color to remove */
  keyColor: [number, number, number];
  /** Tolerance in color distance (0-255 range, mapped from 0-100%) */
  tolerance: number;
  /** Edge softness in color distance units */
  softness: number;
}

/** Preset colors for quick selection — optimized for common use cases */
export const CHROMA_KEY_PRESETS = [
  { color: '#ffffff', label: 'Blanco', icon: '⬜' },
  { color: '#000000', label: 'Negro', icon: '⬛' },
  { color: '#00ff00', label: 'Verde', icon: '🟩' },
  { color: '#0000ff', label: 'Azul', icon: '🟦' },
] as const;

/**
 * Parse a hex color string to an RGB tuple.
 * Supports #RGB, #RRGGBB, and plain RRGGBB formats.
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const num = parseInt(clean, 16);
  return [
    (num >> 16) & 0xff,
    (num >> 8) & 0xff,
    num & 0xff,
  ];
}

/**
 * Convert RGB to a hex color string (#RRGGBB).
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Apply chroma key to canvas ImageData in-place.
 * 
 * Uses Euclidean distance in RGB color space to determine how close
 * each pixel is to the key color. Pixels within tolerance become fully
 * transparent; pixels in the softness zone get partial transparency for
 * smooth edges.
 * 
 * @param imageData - The ImageData to process (modified in-place)
 * @param params - Chroma key configuration
 */
export function applyChromaKey(
  imageData: ImageData,
  params: ChromaKeyParams
): void {
  const { keyColor, tolerance, softness } = params;
  const data = imageData.data;
  const [kr, kg, kb] = keyColor;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Euclidean distance in RGB space
    const dr = r - kr;
    const dg = g - kg;
    const db = b - kb;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < tolerance) {
      // Fully transparent — within the key color range
      data[i + 3] = 0;
    } else if (softness > 0 && distance < tolerance + softness) {
      // Partial transparency — smooth edge transition
      const alpha = Math.round(255 * ((distance - tolerance) / softness));
      data[i + 3] = Math.min(data[i + 3], alpha);

      // Spill suppression: reduce the key color influence on edge pixels
      // This prevents a colored "halo" around the subject
      const spillFactor = 1 - ((tolerance + softness - distance) / softness) * 0.5;
      data[i] = Math.round(r + (r - kr) * (1 - spillFactor));
      data[i + 1] = Math.round(g + (g - kg) * (1 - spillFactor));
      data[i + 2] = Math.round(b + (b - kb) * (1 - spillFactor));

      // Clamp values
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
    // else: pixel is outside the range, keep as-is
  }
}

/**
 * Map user-facing percentage values (0-100) to internal distance values.
 * The max RGB distance is ~441 (sqrt(255² + 255² + 255²)).
 */
export function mapToleranceToDistance(tolerancePercent: number): number {
  return (tolerancePercent / 100) * 441;
}

export function mapSoftnessToDistance(softnessPercent: number): number {
  return (softnessPercent / 100) * 150;
}
