import React, { useState, useEffect } from 'react';
import { Palette, Copy, Check } from 'lucide-react';

interface ColorPaletteExtractorProps {
  imageUrl: string;
  onColorSelect?: (color: string) => void;
}

/**
 * ColorPaletteExtractor — Extracts dominant colors from an image.
 * Uses canvas sampling to pull the 6 most prominent colors.
 */
export const ColorPaletteExtractor: React.FC<ColorPaletteExtractorProps> = ({
  imageUrl,
  onColorSelect,
}) => {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const extractColors = () => {
    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Downscale for performance
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Simple color bucketing
        const colorMap = new Map<string, number>();
        for (let i = 0; i < data.length; i += 4 * 5) { // Sample every 5th pixel
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        // Sort by frequency, take top 6
        const sorted = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([hex]) => hex);

        setColors(sorted);
      } catch (err) {
        console.warn('Color extraction failed:', err);
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => setLoading(false);
    img.src = imageUrl;
  };

  const copyColor = (color: string, idx: number) => {
    navigator.clipboard?.writeText(color);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    onColorSelect?.(color);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-neutral-500 flex items-center gap-1">
          <Palette size={10} />
          Paleta de Colores
        </span>
        <button
          onClick={extractColors}
          title="Extraer colores de la imagen"
          disabled={loading}
          className="text-[8px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors border border-neutral-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Extraer'}
        </button>
      </div>

      {colors.length > 0 && (
        <div className="flex gap-1">
          {colors.map((color, i) => (
            <button
              key={`${color}-${i}`}
              onClick={() => copyColor(color, i)}
              title={`${color} — click para copiar`}
              className="relative w-7 h-7 rounded-md border border-neutral-700 hover:border-white transition-all hover:scale-110 group"
              style={{ backgroundColor: color }}
            >
              {copiedIdx === i && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
