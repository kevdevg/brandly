import React, { useRef, useEffect, useState } from 'react';
import { getPeaks } from '../../utils/audioWaveform';

interface AudioWaveformCanvasProps {
  src: string;
  width: number;
  height: number;
  color?: string;
  bgColor?: string;
  /** Number of peak buckets to render */
  resolution?: number;
}

/**
 * Canvas-based audio waveform visualization.
 * Decodes the audio file and renders real peak data.
 */
export const AudioWaveformCanvas: React.FC<AudioWaveformCanvasProps> = ({
  src,
  width,
  height,
  color = 'rgba(129, 140, 248, 0.6)',
  bgColor = 'transparent',
  resolution = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);

  // Load peaks when src changes
  useEffect(() => {
    let cancelled = false;
    setPeaks(null);

    if (src) {
      getPeaks(src, resolution).then((data) => {
        if (!cancelled) setPeaks(data);
      });
    }

    return () => { cancelled = true; };
  }, [src, resolution]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw waveform bars
    const barWidth = width / peaks.length;
    const centerY = height / 2;

    ctx.fillStyle = color;

    for (let i = 0; i < peaks.length; i++) {
      const amp = peaks[i];
      const barH = Math.max(1, amp * (height * 0.85));
      const x = i * barWidth;
      const y = centerY - barH / 2;

      // Round to nearest pixel for crisp rendering
      ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.max(1, Math.round(barWidth) - 1),
        Math.round(barH)
      );
    }
  }, [peaks, width, height, color, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
      className="pointer-events-none"
    />
  );
};
