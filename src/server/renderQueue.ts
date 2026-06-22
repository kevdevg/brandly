/**
 * Render Queue — Server-side job queue for Remotion rendering.
 *
 * Features:
 * - In-memory job queue with concurrent rendering limit
 * - SSE (Server-Sent Events) for real-time progress
 * - Support for video (MP4) and image (PNG) export
 * - Job lifecycle: queued → rendering → done / error
 */
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// ═══ Types ═══

export type RenderFormat = 'mp4' | 'webm' | 'gif' | 'png' | 'jpeg';

export interface RenderJob {
  id: string;
  status: 'queued' | 'rendering' | 'done' | 'error';
  progress: number;         // 0-100
  format: RenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  compositionId: string;
  inputProps: Record<string, any>;
  outputPath?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  renderedFrames?: number;
  totalFrames?: number;
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  estimatedSizeMB?: number;
  priority?: number;         // Higher = process first
  fileSizeBytes?: number;    // Actual output file size
}

export interface RenderJobCreateParams {
  format: RenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  compositionId: string;
  inputProps: Record<string, any>;
}

// ═══ Constants ═══

const MAX_CONCURRENT = 1; // Remotion renders are CPU-intensive
const RENDERS_DIR = path.join(process.cwd(), 'renders');

// Ensure renders directory exists
if (!fs.existsSync(RENDERS_DIR)) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

// ═══ State ═══

const jobs = new Map<string, RenderJob>();
const sseClients = new Map<string, Set<(data: string) => void>>();
let activeRenders = 0;
let bundlePath: string | null = null;
let isBundling = false;

// ═══ SSE Helpers ═══

function broadcastJobUpdate(job: RenderJob) {
  const data = JSON.stringify({
    type: 'job-update',
    job: sanitizeJob(job),
  });

  // Broadcast to all connected SSE clients
  for (const [, clients] of sseClients) {
    for (const send of clients) {
      send(data);
    }
  }
}

function sanitizeJob(job: RenderJob): Omit<RenderJob, 'inputProps'> & { inputProps?: undefined } {
  // Don't send inputProps over SSE (too large)
  const { inputProps, ...rest } = job;
  return rest;
}

export function addSSEClient(clientId: string, send: (data: string) => void): () => void {
  if (!sseClients.has(clientId)) {
    sseClients.set(clientId, new Set());
  }
  sseClients.get(clientId)!.add(send);

  // Return cleanup function
  return () => {
    const clients = sseClients.get(clientId);
    if (clients) {
      clients.delete(send);
      if (clients.size === 0) sseClients.delete(clientId);
    }
  };
}

// ═══ Bundle Management ═══

async function ensureBundle(): Promise<string> {
  if (bundlePath) return bundlePath;
  if (isBundling) {
    // Wait for existing bundle
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (bundlePath) {
          clearInterval(check);
          resolve(bundlePath);
        }
      }, 500);
    });
  }

  isBundling = true;
  console.log('📦 Bundling Remotion project...');

  try {
    const { bundle } = await import('@remotion/bundler');
    const entryPoint = path.join(process.cwd(), 'src', 'Root.tsx');

    bundlePath = await bundle({
      entryPoint,
      // Use the project's Webpack config if it exists
      webpackOverride: (config) => config,
    });

    console.log('✅ Bundle ready:', bundlePath);
    return bundlePath;
  } catch (err) {
    console.error('❌ Bundle failed:', err);
    throw err;
  } finally {
    isBundling = false;
  }
}

// ═══ Job Management ═══

export function createJob(params: RenderJobCreateParams): RenderJob {
  const job: RenderJob = {
    id: crypto.randomUUID(),
    status: 'queued',
    progress: 0,
    ...params,
    createdAt: Date.now(),
    totalFrames: params.format === 'png' || params.format === 'jpeg' ? 1 : params.durationInFrames,
    renderedFrames: 0,
  };

  jobs.set(job.id, job);
  broadcastJobUpdate(job);
  processQueue(); // Try to start rendering immediately

  return job;
}

export function getJob(id: string): RenderJob | undefined {
  return jobs.get(id);
}

export function getAllJobs(): RenderJob[] {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;

  // Clean up output file if it exists
  if (job.outputPath && fs.existsSync(job.outputPath)) {
    try { fs.unlinkSync(job.outputPath); } catch {}
  }

  jobs.delete(id);
  broadcastJobUpdate({ ...job, status: 'error', error: 'Deleted' });
  return true;
}

// ═══ Queue Processing ═══

async function processQueue() {
  if (activeRenders >= MAX_CONCURRENT) return;

  // Pick highest priority queued job
  const queuedJobs = Array.from(jobs.values())
    .filter(j => j.status === 'queued')
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const nextJob = queuedJobs[0];
  if (!nextJob) return;

  activeRenders++;
  nextJob.status = 'rendering';
  nextJob.startedAt = Date.now();
  broadcastJobUpdate(nextJob);

  try {
    await renderJob(nextJob);
  } catch (err: any) {
    nextJob.status = 'error';
    nextJob.error = err.message || 'Unknown render error';
    nextJob.completedAt = Date.now();
    broadcastJobUpdate(nextJob);
    console.error(`❌ Render failed [${nextJob.id}]:`, err);
  } finally {
    activeRenders--;
    processQueue(); // Process next in queue
  }
}

async function renderJob(job: RenderJob): Promise<void> {
  const serveUrl = await ensureBundle();
  const isStill = job.format === 'png' || job.format === 'jpeg';
  const ext = job.format;
  const outputPath = path.join(RENDERS_DIR, `${job.id}.${ext}`);

  console.log(`🎬 Rendering [${job.id}] → ${job.format} (${job.width}×${job.height})`);

  // Resolve the full composition config from the bundle
  const { selectComposition } = await import('@remotion/renderer');
  const composition = await selectComposition({
    serveUrl,
    id: job.compositionId,
    inputProps: job.inputProps,
  });

  // Override dimensions and duration from job config
  const config = {
    ...composition,
    width: job.width,
    height: job.height,
    fps: job.fps,
    durationInFrames: isStill ? 1 : job.durationInFrames,
  };

  if (isStill) {
    const { renderStill } = await import('@remotion/renderer');

    await renderStill({
      serveUrl,
      composition: config,
      output: outputPath,
      imageFormat: job.format as 'png' | 'jpeg',
      inputProps: job.inputProps,
    });

    job.progress = 100;
    job.renderedFrames = 1;
    broadcastJobUpdate(job);
  } else {
    const { renderMedia } = await import('@remotion/renderer');

    await renderMedia({
      serveUrl,
      composition: config,
      codec: job.format === 'webm' ? 'vp8' : 'h264',
      outputLocation: outputPath,
      inputProps: job.inputProps,
      onProgress: ({ renderedFrames, encodedFrames }) => {
        const progress = Math.round(
          ((renderedFrames ?? encodedFrames ?? 0) / job.durationInFrames) * 100
        );
        job.progress = Math.min(progress, 99);
        job.renderedFrames = renderedFrames ?? encodedFrames ?? 0;
        broadcastJobUpdate(job);
      },
    });
  }

  job.status = 'done';
  job.progress = 100;
  job.completedAt = Date.now();
  job.outputPath = outputPath;
  job.downloadUrl = `/api/renders/${job.id}.${ext}`;
  
  // Capture file size
  try {
    const stats = fs.statSync(outputPath);
    job.fileSizeBytes = stats.size;
  } catch {}
  
  broadcastJobUpdate(job);

  const elapsed = ((job.completedAt - (job.startedAt ?? job.createdAt)) / 1000).toFixed(1);
  const sizeMB = job.fileSizeBytes ? (job.fileSizeBytes / (1024 * 1024)).toFixed(1) + 'MB' : 'unknown';
  console.log(`✅ Render complete [${job.id}] in ${elapsed}s (${sizeMB}) → ${job.downloadUrl}`);
}

// ═══ Cleanup (auto-delete old renders after 1 hour) ═══

setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.status === 'done' && job.completedAt && job.completedAt < oneHourAgo) {
      deleteJob(id);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes
