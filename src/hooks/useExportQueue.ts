/**
 * useExportQueue — Client-side hook for managing export jobs via SSE.
 *
 * Provides:
 * - startExport(): Create a new render job
 * - jobs: Live list of all render jobs
 * - cancelJob(): Delete a job
 * - downloadJob(): Trigger browser download
 * - isConnected: SSE connection status
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimelineElement, TimelineLayer, DesignMD } from '../types';
import { resolveBlobUrls } from '../utils/uploadBlobContent';

// ═══ Types (mirror server-side) ═══

export type RenderFormat = 'mp4' | 'webm' | 'gif' | 'png' | 'jpeg';

export interface RenderJobClient {
  id: string;
  status: 'queued' | 'rendering' | 'done' | 'error';
  progress: number;
  format: RenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  compositionId: string;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  renderedFrames?: number;
  totalFrames?: number;
}

export interface ExportConfig {
  format: RenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  designMD: DesignMD;
  textOverlay: string;
  timelineElements: TimelineElement[];
  layers: TimelineLayer[];
  brandVisibility?: { logo: boolean; frame: boolean; background: boolean };
  outputFormat?: 'video' | 'image';
}

export function useExportQueue() {
  const [jobs, setJobs] = useState<RenderJobClient[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── SSE Connection ───
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/render/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      console.log('📡 SSE connected');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'job-update' && data.job) {
          setJobs(prev => {
            const idx = prev.findIndex(j => j.id === data.job.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = data.job;
              return updated;
            }
            return [data.job, ...prev];
          });
        }
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Auto-reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, []);

  // ─── Connect on mount ───
  useEffect(() => {
    connect();

    // Load initial jobs
    fetch('/api/render/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(() => {});

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // ─── Start Export ───
  const startExport = useCallback(async (config: ExportConfig): Promise<RenderJobClient | null> => {
    const isStill = config.format === 'png' || config.format === 'jpeg';

    // Resolve blob: URLs to persistent server URLs before sending to server-side render
    const resolvedElements = await resolveBlobUrls(config.timelineElements);

    // Strip non-serializable props for render (callbacks, refs, etc.)
    const inputProps = {
      designMD: config.designMD,
      textOverlay: config.textOverlay,
      timelineElements: resolvedElements,
      layers: config.layers,
      brandVisibility: config.brandVisibility,
      outputFormat: config.outputFormat,
    };

    const body = {
      format: config.format,
      width: config.width,
      height: config.height,
      fps: config.fps,
      durationInFrames: isStill ? 1 : config.durationInFrames,
      compositionId: isStill ? 'BrandStill' : 'BrandVideo',
      inputProps,
    };

    try {
      const res = await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const job: RenderJobClient = await res.json();
      setJobs(prev => [job, ...prev.filter(j => j.id !== job.id)]);
      return job;
    } catch (err) {
      console.error('Export start failed:', err);
      return null;
    }
  }, []);

  // ─── Cancel Job ───
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/render/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  }, []);

  // ─── Download ───
  const downloadJob = useCallback((job: RenderJobClient) => {
    if (!job.downloadUrl) return;

    const a = document.createElement('a');
    a.href = job.downloadUrl;
    a.download = `export-${job.id.slice(0, 8)}.${job.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // ─── Derived state ───
  const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'rendering');
  const hasActiveJobs = activeJobs.length > 0;

  return {
    jobs,
    activeJobs,
    hasActiveJobs,
    isConnected,
    startExport,
    cancelJob,
    downloadJob,
  };
}
