import React, { useState, useMemo } from 'react';
import { X, Download, Film, Image as ImageIcon, Wifi, WifiOff, Zap, ChevronDown } from 'lucide-react';
import { useExportQueue, RenderFormat, ExportConfig } from '../../hooks/useExportQueue';
import { ExportJobItem } from './ExportJobItem';
import type { DesignMD, TimelineElement, TimelineLayer } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  designMD: DesignMD;
  textOverlay: string;
  timelineElements: TimelineElement[];
  layers: TimelineLayer[];
  durationInFrames: number;
  brandVisibility?: { logo: boolean; frame: boolean; background: boolean };
  outputFormat?: 'video' | 'image';
  /** Template aspect ratio — used to filter resolution presets */
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '4:3';
}

const FORMAT_OPTIONS: { value: RenderFormat; label: string; icon: typeof Film; desc: string }[] = [
  { value: 'mp4', label: 'MP4', icon: Film, desc: 'Compatible con todo' },
  { value: 'webm', label: 'WebM', icon: Film, desc: 'Web optimizado' },
  { value: 'gif', label: 'GIF', icon: Film, desc: 'Animación ligera' },
  { value: 'png', label: 'PNG', icon: ImageIcon, desc: 'Imagen sin fondo' },
  { value: 'jpeg', label: 'JPEG', icon: ImageIcon, desc: 'Imagen comprimida' },
];

const RESOLUTION_PRESETS = [
  { label: '1080×1080', w: 1080, h: 1080, desc: 'Instagram Post', ratio: '1:1' },
  { label: '720×720', w: 720, h: 720, desc: 'Preview rápido', ratio: '1:1' },
  { label: '1080×1920', w: 1080, h: 1920, desc: 'Story / Reel', ratio: '9:16' },
  { label: '720×1280', w: 720, h: 1280, desc: 'Preview rápido', ratio: '9:16' },
  { label: '1920×1080', w: 1920, h: 1080, desc: 'YouTube / TV', ratio: '16:9' },
  { label: '1280×720', w: 1280, h: 720, desc: 'HD 720p', ratio: '16:9' },
  { label: '1080×1350', w: 1080, h: 1350, desc: 'Feed 4:5', ratio: '4:5' },
  { label: '720×900', w: 720, h: 900, desc: 'Preview 4:5', ratio: '4:5' },
  { label: '1440×1080', w: 1440, h: 1080, desc: 'Pantalla 4:3', ratio: '4:3' },
  { label: '960×720', w: 960, h: 720, desc: 'Preview 4:3', ratio: '4:3' },
];

/**
 * Export modal — format selection, resolution presets, and live job queue.
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  designMD,
  textOverlay,
  timelineElements,
  layers,
  durationInFrames,
  brandVisibility,
  outputFormat,
  aspectRatio,
}) => {
  const { jobs, activeJobs, hasActiveJobs, isConnected, startExport, cancelJob, downloadJob } = useExportQueue();

  const [format, setFormat] = useState<RenderFormat>('mp4');
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high' | 'ultra'>('high');

  const isStill = format === 'png' || format === 'jpeg';

  // Filter resolution presets to match the template's aspect ratio
  const filteredPresets = useMemo(() => {
    if (!aspectRatio) return RESOLUTION_PRESETS;
    const matching = RESOLUTION_PRESETS.filter(p => p.ratio === aspectRatio);
    return matching.length > 0 ? matching : RESOLUTION_PRESETS;
  }, [aspectRatio]);

  const [resIdx, setResIdx] = useState(0);
  const selectedRes = filteredPresets[resIdx] || filteredPresets[0];

  // Estimated file size
  const estimatedSize = useMemo(() => {
    if (isStill) return '~0.5 MB';
    const seconds = durationInFrames / fps;
    const pixels = selectedRes.w * selectedRes.h;
    const bitrateMap: Record<string, number> = { mp4: 5, webm: 3, gif: 15 };
    const bitrate = bitrateMap[format] ?? 5; // MB per minute per megapixel
    const mp = pixels / 1_000_000;
    const sizeMB = (seconds / 60) * bitrate * mp;
    return sizeMB < 1 ? `~${Math.round(sizeMB * 1024)} KB` : `~${sizeMB.toFixed(1)} MB`;
  }, [format, selectedRes, durationInFrames, fps, isStill]);

  // Auto-select image format in image mode
  const filteredFormats = useMemo(() => {
    if (outputFormat === 'image') {
      return FORMAT_OPTIONS.filter(f => f.value === 'png' || f.value === 'jpeg');
    }
    return FORMAT_OPTIONS;
  }, [outputFormat]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const config: ExportConfig = {
        format,
        width: selectedRes.w,
        height: selectedRes.h,
        fps,
        durationInFrames: isStill ? 1 : durationInFrames,
        designMD,
        textOverlay,
        timelineElements,
        layers,
        brandVisibility,
        outputFormat,
      };
      await startExport(config);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 w-[480px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
              <Download size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Exportar</h2>
              <p className="text-[10px] text-neutral-500">Renderizar y descargar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" title={isConnected ? 'Conectado al servidor' : 'Sin conexión'}>
              {isConnected
                ? <Wifi size={12} className="text-emerald-400" />
                : <WifiOff size={12} className="text-red-400" />
              }
              <span className={`text-[9px] ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button onClick={onClose} title="Cerrar" className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Formato</label>
            <div className="grid grid-cols-2 gap-2">
              {filteredFormats.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    title={opt.desc}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                      format === opt.value
                        ? 'bg-violet-600/15 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/5'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >
                    <Icon size={16} />
                    <div className="text-left">
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[9px] text-neutral-500">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">Resolución</label>
            <div className="flex flex-wrap gap-1.5">
              {filteredPresets.map((preset, idx) => (
                <button
                  key={preset.label}
                  onClick={() => setResIdx(idx)}
                  title={preset.desc}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    resIdx === idx
                      ? 'bg-violet-600/15 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-neutral-600 mt-1">{selectedRes.desc}</p>
          </div>

          {/* Advanced Settings */}
          {!isStill && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <ChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Configuración avanzada
              </button>
              {showAdvanced && (
                <div className="mt-2 bg-neutral-900/50 border border-neutral-800/50 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">FPS</label>
                    <div className="flex gap-1.5">
                      {[24, 30, 60].map(f => (
                        <button
                          key={f}
                          onClick={() => setFps(f)}
                          className={`px-3 py-1 rounded-md text-[10px] font-medium border transition-all ${
                            fps === f
                              ? 'bg-violet-600/15 border-violet-500/50 text-violet-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                          }`}
                        >
                          {f} fps
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500">Duración</span>
                    <span className="text-neutral-400 font-mono">{(durationInFrames / fps).toFixed(1)}s ({durationInFrames} frames)</span>
                  </div>
                  {/* Quality Tier */}
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">Calidad</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { value: 'draft' as const, label: 'Draft', color: 'text-neutral-400' },
                        { value: 'standard' as const, label: 'Std', color: 'text-sky-400' },
                        { value: 'high' as const, label: 'High', color: 'text-violet-400' },
                        { value: 'ultra' as const, label: 'Ultra', color: 'text-amber-400' },
                      ].map(q => (
                        <button
                          key={q.value}
                          onClick={() => {
                            setQuality(q.value);
                            // Auto-adjust resolution: high/ultra → first (largest), draft/standard → last (smallest)
                            const lastIdx = filteredPresets.length - 1;
                            const resMap: Record<string, number> = { draft: lastIdx, standard: lastIdx, high: 0, ultra: 0 };
                            setResIdx(resMap[q.value] ?? 0);
                            const fpsMap: Record<string, number> = { draft: 24, standard: 30, high: 30, ultra: 60 };
                            setFps(fpsMap[q.value] ?? 30);
                          }}
                          title={q.label}
                          className={`py-1 rounded-md text-[9px] font-semibold border transition-all ${
                            quality === q.value
                              ? 'bg-violet-600/15 border-violet-500/50 text-violet-300'
                              : `bg-neutral-900 border-neutral-800 ${q.color} hover:border-neutral-700`
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || !isConnected}
            title="Iniciar exportación"
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              isExporting || !isConnected
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
            }`}
          >
            <Zap size={16} />
            {isExporting ? 'Iniciando...' : `Exportar ${isStill ? 'Imagen' : 'Video'}`}
            <span className="text-[9px] opacity-60 font-mono">({estimatedSize})</span>
          </button>

          {/* Job Queue */}
          {jobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                  Cola de Exportación
                </label>
                {hasActiveJobs && (
                  <span className="text-[9px] text-violet-400 animate-pulse">
                    {activeJobs.length} activ{activeJobs.length > 1 ? 'os' : 'o'}
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {jobs.map(job => (
                  <ExportJobItem
                    key={job.id}
                    job={job}
                    onCancel={cancelJob}
                    onDownload={downloadJob}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
