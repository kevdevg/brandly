import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Clock, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon } from 'lucide-react';

interface RenderJob {
  id: string;
  status: 'queued' | 'rendering' | 'done' | 'error';
  progress: number;
  format: string;
  width: number;
  height: number;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  fileSizeBytes?: number;
}

interface RenderHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * RenderHistoryPanel — Shows past and active render jobs with progress, 
 * download links, and job status information.
 */
export const RenderHistoryPanel: React.FC<RenderHistoryPanelProps> = ({ isOpen, onClose }) => {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/render/jobs')
      .then(res => res.json())
      .then(data => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));

    // SSE for real-time updates
    const es = new EventSource('/api/render/events');
    es.onmessage = (event) => {
      try {
        const { type, job } = JSON.parse(event.data);
        if (type === 'job-update' && job) {
          setJobs(prev => {
            const idx = prev.findIndex(j => j.id === job.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = job;
              return updated;
            }
            return [job, ...prev];
          });
        }
      } catch {}
    };

    return () => es.close();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock size={12} className="text-amber-400" />;
      case 'rendering': return <Loader2 size={12} className="text-violet-400 animate-spin" />;
      case 'done': return <CheckCircle size={12} className="text-emerald-400" />;
      case 'error': return <AlertCircle size={12} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-[480px] max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileVideo size={16} className="text-violet-400" />
            Historial de Renders
          </h3>
          <button onClick={onClose} title="Cerrar" className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] custom-scrollbar p-3 space-y-2">
          {loading && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              <Loader2 size={20} className="animate-spin mx-auto mb-2" />
              Cargando...
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="text-center py-8 text-neutral-600 text-xs">
              No hay renders aún. Haz clic en "Renderizar" para comenzar.
            </div>
          )}

          {jobs.map(job => (
            <div key={job.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(job.status)}
                  <span className="text-[10px] font-medium text-neutral-300 uppercase">
                    {job.format}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono">
                    {job.width}×{job.height}
                  </span>
                </div>
                <span className="text-[9px] text-neutral-600 font-mono">
                  {new Date(job.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Progress bar */}
              {job.status === 'rendering' && (
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all rounded-full"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}

              {/* Status info */}
              <div className="flex items-center justify-between text-[9px]">
                {job.status === 'rendering' && (
                  <span className="text-violet-400 font-mono">{job.progress}%</span>
                )}
                {job.status === 'done' && (
                  <span className="text-emerald-400">
                    ✅ Completado en {formatTime((job.completedAt ?? 0) - job.createdAt)} — {formatSize(job.fileSizeBytes)}
                  </span>
                )}
                {job.status === 'error' && (
                  <span className="text-red-400">{job.error}</span>
                )}
                {job.status === 'queued' && (
                  <span className="text-amber-400">En cola...</span>
                )}

                {/* Download button */}
                {job.status === 'done' && job.downloadUrl && (
                  <a
                    href={job.downloadUrl}
                    download
                    title="Descargar"
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 text-emerald-300 rounded hover:bg-emerald-600/30 transition-colors"
                  >
                    <Download size={10} />
                    <span>Descargar</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
