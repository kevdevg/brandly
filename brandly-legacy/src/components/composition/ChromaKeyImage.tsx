import React, { useRef, useEffect, useMemo } from 'react';
import {
  applyChromaKey,
  hexToRgb,
  mapToleranceToDistance,
  mapSoftnessToDistance,
} from '../../utils/chromaKeyUtils';
import { ChromaKeyShader } from '../../utils/ChromaKeyShader';

interface ChromaKeyImageProps {
  src: string;
  chromaKeyColor: string;
  chromaKeyTolerance: number;
  chromaKeySoftness: number;
  style?: React.CSSProperties;
  draggable?: boolean;
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
 * Renders an image with chroma key background removal.
 * 
 * Attempts WebGL2 shader processing for GPU acceleration.
 * Falls back to Canvas 2D pixel manipulation if WebGL is unavailable.
 * The result is cached — re-processes only when parameters change.
 */
export const ChromaKeyImage: React.FC<ChromaKeyImageProps> = ({
  src,
  chromaKeyColor,
  chromaKeyTolerance,
  chromaKeySoftness,
  style = {},
  draggable = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const shaderRef = useRef<ChromaKeyShader | null>(null);
  const useWebGL = useRef(isWebGLSupported());

  const keyColor = useMemo(() => hexToRgb(chromaKeyColor), [chromaKeyColor]);

  const canvas2dParams = useMemo(() => ({
    keyColor,
    tolerance: mapToleranceToDistance(chromaKeyTolerance),
    softness: mapSoftnessToDistance(chromaKeySoftness),
  }), [keyColor, chromaKeyTolerance, chromaKeySoftness]);

  const webglParams = useMemo(() => ({
    keyColor,
    tolerance: chromaKeyTolerance / 100 * 0.8, // Normalize to 0-0.8 range for shader
    softness: chromaKeySoftness / 100 * 0.4,    // Normalize to 0-0.4 range
    spillSuppress: 0.5,
  }), [keyColor, chromaKeyTolerance, chromaKeySoftness]);

  // Cleanup shader on unmount
  useEffect(() => {
    return () => {
      shaderRef.current?.dispose();
      shaderRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const processWithImage = (img: HTMLImageElement) => {
      if (useWebGL.current) {
        try {
          // Initialize shader lazily
          if (!shaderRef.current) {
            shaderRef.current = new ChromaKeyShader(canvas);
          }
          shaderRef.current.render(img, webglParams);
        } catch (e) {
          console.warn('ChromaKeyImage: WebGL failed, falling back to Canvas 2D', e);
          useWebGL.current = false;
          shaderRef.current?.dispose();
          shaderRef.current = null;
          processCanvas2D(img, canvas, canvas2dParams);
        }
      } else {
        processCanvas2D(img, canvas, canvas2dParams);
      }
    };

    // If image already loaded, process immediately
    if (imgRef.current && imgRef.current.src === src && imgRef.current.complete) {
      processWithImage(imgRef.current);
      return;
    }

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      processWithImage(img);
    };
    img.onerror = () => {
      console.warn('ChromaKeyImage: failed to load image', src);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, canvas2dParams, webglParams]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...style,
        imageRendering: 'auto',
      }}
      draggable={draggable}
    />
  );
};

function processCanvas2D(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  params: { keyColor: [number, number, number]; tolerance: number; softness: number }
): void {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyChromaKey(imageData, params);
  ctx.putImageData(imageData, 0, 0);
}
