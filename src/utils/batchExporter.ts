/**
 * batchExporter — Utility to render N pieces and package them as a ZIP.
 *
 * Strategy:
 * - For images: uses offscreen canvas capture from Remotion Player screenshots
 * - For video: delegates to the server-side render pipeline (/api/render/start)
 *
 * Uses JSZip for packaging and file-saver for download.
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { compileExpressToTimeline, getAspectDimensions } from './expressCompiler';
import { resolveBlobFieldData } from './uploadBlobContent';
import type {
  BatchPieceData, ExpressTemplate, CompanyProfile, DesignMD,
} from '../types';

export interface BatchExportOptions {
  format: 'png' | 'jpeg';
  /** Quality for JPEG (0-1). Default 0.92 */
  quality?: number;
}

export interface BatchExportProgress {
  current: number;
  total: number;
  status: 'rendering' | 'packaging' | 'done' | 'error';
  error?: string;
}

/**
 * Find the background field ID to inject per-piece backgrounds.
 */
function findBackgroundFieldId(template: ExpressTemplate): string | null {
  for (const scene of template.scenes) {
    const fields = scene.fields ?? [];
    const bgField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video') && f.isBackground
    );
    if (bgField) return bgField.id;
    const mediaField = fields.find(f =>
      f.nature === 'editable-slot' && (f.type === 'image' || f.type === 'video')
    );
    if (mediaField) return mediaField.id;
  }
  return null;
}

/**
 * Render a single piece to an image blob using an offscreen canvas.
 * Creates a temporary iframe with a Remotion-like render, captures it.
 */
async function renderPieceToImage(
  piece: BatchPieceData,
  template: ExpressTemplate,
  designMD: DesignMD,
  brand: CompanyProfile,
  backgroundFieldId: string | null,
  dimensions: { w: number; h: number },
  options: BatchExportOptions,
): Promise<Blob> {
  // Build fieldData with background injected
  const rawFieldData: Record<string, string> = { ...piece.fieldData };
  if (backgroundFieldId && piece.backgroundUrl) {
    rawFieldData[backgroundFieldId] = piece.backgroundUrl;
  }

  // Resolve blob: URLs to persistent server URLs
  const fieldData = await resolveBlobFieldData(rawFieldData);

  const compiled = compileExpressToTimeline(template, fieldData, designMD, brand);
  // Strip transitions
  compiled.elements = compiled.elements.map(el => ({
    ...el,
    transitionIn: undefined,
    transitionOut: undefined,
  }));

  // Use the server-side render endpoint for high-quality output
  const isStill = true;
  const inputProps = {
    designMD,
    timelineElements: compiled.elements,
    layers: compiled.layers,
    selectedElementId: null,
    textOverlay: '',
    brandVisibility: { logo: false, frame: false, background: true },
    outputFormat: template.format,
  };

  const body = {
    format: options.format,
    width: dimensions.w,
    height: dimensions.h,
    fps: 30,
    durationInFrames: 1,
    compositionId: 'BrandStill',
    inputProps,
  };

  const res = await fetch('/api/render/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Render failed for piece ${piece.index + 1}`);
  }

  const job = await res.json();

  // Poll for completion
  const maxWait = 60_000; // 60s timeout
  const pollInterval = 1_000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, pollInterval));

    const statusRes = await fetch(`/api/render/jobs/${job.id}`);
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();

    if (statusData.status === 'done' && statusData.downloadUrl) {
      const fileRes = await fetch(statusData.downloadUrl);
      if (!fileRes.ok) throw new Error(`Download failed for piece ${piece.index + 1}`);
      return await fileRes.blob();
    }

    if (statusData.status === 'error') {
      throw new Error(statusData.error || `Render error for piece ${piece.index + 1}`);
    }
  }

  throw new Error(`Render timeout for piece ${piece.index + 1}`);
}

/**
 * Export all batch pieces as a ZIP file.
 *
 * @param pieces - Array of batch pieces to render
 * @param template - The Express template
 * @param brand - Brand profile (for DesignMD + brand variables)
 * @param options - Export format options
 * @param onProgress - Progress callback
 * @returns Promise that resolves when download starts
 */
export async function exportBatchAsZip(
  pieces: BatchPieceData[],
  template: ExpressTemplate,
  brand: CompanyProfile,
  options: BatchExportOptions,
  onProgress?: (progress: BatchExportProgress) => void,
): Promise<void> {
  const designMD = brand.design;
  const dimensions = getAspectDimensions(template.aspectRatio);
  const backgroundFieldId = findBackgroundFieldId(template);
  const zip = new JSZip();

  const validPieces = pieces.filter(p => p.isValid);
  const total = validPieces.length;

  onProgress?.({ current: 0, total, status: 'rendering' });

  for (let i = 0; i < validPieces.length; i++) {
    const piece = validPieces[i];

    try {
      const blob = await renderPieceToImage(
        piece, template, designMD, brand, backgroundFieldId, dimensions, options,
      );

      // Name file: use background filename (without ext) or fallback to index
      const ext = options.format === 'jpeg' ? 'jpg' : 'png';
      const baseName = piece.backgroundFilename
        ? piece.backgroundFilename.replace(/\.[^.]+$/, '')
        : `pieza-${piece.index + 1}`;
      const fileName = `${baseName}.${ext}`;

      zip.file(fileName, blob);
    } catch (err) {
      console.error(`Failed to render piece ${piece.index + 1}:`, err);
      // Add an error placeholder
      zip.file(`ERROR_pieza-${piece.index + 1}.txt`, `Error rendering piece: ${err}`);
    }

    onProgress?.({ current: i + 1, total, status: 'rendering' });
  }

  onProgress?.({ current: total, total, status: 'packaging' });

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const zipName = `${template.name}_${brand.name}_lote-${total}.zip`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  saveAs(zipBlob, zipName);

  onProgress?.({ current: total, total, status: 'done' });
}
