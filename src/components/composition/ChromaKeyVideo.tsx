import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  applyChromaKey,
  hexToRgb,
  mapToleranceToDistance,
  mapSoftnessToDistance,
} from '../../utils/chromaKeyUtils';
import { ChromaKeyShader } from '../../utils/ChromaKeyShader';

interface ChromaKeyVideoProps {
  src: string;
  chromaKeyColor: string;
  chromaKeyTolerance: number;
  chromaKeySoftness: number;
  style?: React.CSSProperties;
  volume?: number | ((frame: number) => number);
}

// Cache WebGL support check
let webglSupported: boolean | null = null;
function isWebGLSupported(): boolean {
  if (webglSupported === null) {
    webglSupported = ChromaKeyShader.isSupported();
  }
  return webglSupported;
}

/**
 * Renders a video with chroma key background removal.
 * 
 * Uses a hidden <video> element synced to Remotion's current frame.
 * Attempts WebGL2 shader processing for GPU-accelerated performance.
 * Falls back to Canvas 2D pixel manipulation if WebGL is unavailable.
 * 
 * Canvas 2D fallback processes at 50% resolution for performance.
 */
export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({
  src,
  chromaKeyColor,
  chromaKeyTolerance,
  chromaKeySoftness,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shaderRef = useRef<ChromaKeyShader | null>(null);
  const rafRef = useRef<number>(0);
  const useWebGL = useRef(isWebGLSupported());

  const keyColor = useMemo(() => hexToRgb(chromaKeyColor), [chromaKeyColor]);

  const canvas2dParams = useMemo(() => ({
    keyColor,
    tolerance: mapToleranceToDistance(chromaKeyTolerance),
    softness: mapSoftnessToDistance(chromaKeySoftness),
  }), [keyColor, chromaKeyTolerance, chromaKeySoftness]);

  const webglParams = useMemo(() => ({
    keyColor,
    tolerance: chromaKeyTolerance / 100 * 0.8,
    softness: chromaKeySoftness / 100 * 0.4,
    spillSuppress: 0.5,
  }), [keyColor, chromaKeyTolerance, chromaKeySoftness]);

  // Cleanup shader on unmount
  useEffect(() => {
    return () => {
      shaderRef.current?.dispose();
      shaderRef.current = null;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Process current video frame
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    if (useWebGL.current) {
      try {
        if (!shaderRef.current) {
          shaderRef.current = new ChromaKeyShader(canvas);
        }
        shaderRef.current.render(video, webglParams);
      } catch (e) {
        console.warn('ChromaKeyVideo: WebGL failed, falling back to Canvas 2D', e);
        useWebGL.current = false;
        shaderRef.current?.dispose();
        shaderRef.current = null;
        processCanvas2D(video, canvas, canvas2dParams);
      }
    } else {
      processCanvas2D(video, canvas, canvas2dParams);
    }
  }, [canvas2dParams, webglParams]);

  // Sync video time to Remotion frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = frame / fps;
    // Only seek if significantly out of sync
    if (Math.abs(video.currentTime - targetTime) > 0.05) {
      video.currentTime = targetTime;
    }

    // Process after seek
    const onSeeked = () => processFrame();
    video.addEventListener('seeked', onSeeked, { once: true });

    // Also process immediately if video is ready
    if (video.readyState >= 2) {
      rafRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      video.removeEventListener('seeked', onSeeked);
      cancelAnimationFrame(rafRef.current);
    };
  }, [frame, fps, processFrame]);

  // Re-process when chroma key params change
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      processFrame();
    }
  }, [canvas2dParams, webglParams, processFrame]);

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Hidden video element for frame source */}
      <video
        ref={videoRef}
        src={src}
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
      {/* Visible canvas with processed frames */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: (style as any).objectFit || 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
};

function processCanvas2D(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  params: { keyColor: [number, number, number]; tolerance: number; softness: number }
): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Process at 50% resolution for performance
  const scale = 0.5;
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(video, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  applyChromaKey(imageData, params);
  ctx.putImageData(imageData, 0, 0);
}
