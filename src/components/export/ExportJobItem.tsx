import React from 'react';
import { Download, Loader2, CheckCircle2, XCircle, Clock, Trash2, X } from 'lucide-react';
import type { RenderJobClient } from '../../hooks/useExportQueue';

interface ExportJobItemProps {
  job: RenderJobClient;
  onCancel: (id: string) => void;
  onDownload: (job: RenderJobClient) => void;
}

/**
 * Individual export job card with progress bar, status badge, and actions.
 */
export const ExportJobItem: React.FC<ExportJobItemProps> = ({ job, onCancel, onDownload }) => {
  const elapsed = job.startedAt
    ? ((job.completedAt ?? Date.now()) - job.startedAt) / 1000
    : 0;

  const formatLabel = {
    mp4: 'MP4 Video',
    webm: 'WebM Video',
    gif: 'GIF Animación',
    png: 'PNG Image',
    jpeg: 'JPEG Image',
  }[job.format];

  const statusConfig = {
    queued: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'En cola' },
    rendering: { icon: Loader2, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Renderizando' },
    done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completado' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  }[job.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800/60 rounded-xl p-3 space-y-2.5 transition-all hover:border-neutral-700/60">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon
            size={14}
            className={`${statusConfig.color} ${job.status === 'rendering' ? 'animate-spin' : ''}`}
          />
          <span className="text-[11px] font-semibold text-white">{formatLabel}</span>
          <span className="text-[9px] font-mono text-neutral-600">{job.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-1">
          {job.status === 'done' && (
            <button
              onClick={() => onDownload(job)}
              title="Descargar"
              className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              <Download size={12} />
            </button>
          )}
          {(job.status === 'queued' || job.status === 'rendering') && (
            <button
              onClick={() => onCancel(job.id)}
              title="Cancelar"
              className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X size={12} />
            </button>
          )}
          {(job.status === 'done' || job.status === 'error') && (
            <button
              onClick={() => onCancel(job.id)}
              title="Eliminar"
              className="p-1 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(job.status === 'rendering' || job.status === 'queued') && (
        <div className="space-y-1">
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                job.status === 'queued'
                  ? 'bg-amber-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
              }`}
              style={{ width: `${Math.max(job.status === 'queued' ? 5 : job.progress, 2)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-neutral-500">
            <span>{job.progress}%</span>
            {job.renderedFrames != null && job.totalFrames != null && (
              <span>{job.renderedFrames}/{job.totalFrames} frames</span>
            )}
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <div className="flex items-center gap-2 text-[9px] text-neutral-600">
          <span>{job.width}×{job.height}</span>
          {job.fps && <span>{job.fps}fps</span>}
          {elapsed > 0 && <span>{elapsed.toFixed(1)}s</span>}
        </div>
      </div>

      {/* Error message */}
      {job.error && (
        <div className="text-[10px] text-red-400/80 bg-red-500/5 rounded-md px-2 py-1.5 border border-red-500/10">
          {job.error}
        </div>
      )}
    </div>
  );
};
