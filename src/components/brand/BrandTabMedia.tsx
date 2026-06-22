import React, { useCallback } from 'react';
import { Film, Volume2, Music, X, Upload } from 'lucide-react';
import { DesignMD } from '../../types';
import { FileDropZone } from '../ui/FileDropZone';

interface BrandTabMediaProps {
  designMD: DesignMD;
  handleDesignChange: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
}

/**
 * BrandTabMedia — Upload-only panel for brand video/audio assets.
 *
 * Only handles uploading the intro video, outro video, and brand audio.
 * All positioning, fit, duration, and blend controls live in the TemplateBuilder
 * (per-template segment configuration), avoiding collisions.
 */
export const BrandTabMedia: React.FC<BrandTabMediaProps> = ({ designMD, handleDesignChange }) => {

  /** Auto-detect video duration and store it in DesignMD (for BrandPreview playback) */
  const probeVideoDuration = useCallback((url: string, key: 'introDurationFrames' | 'outroDurationFrames') => {
    if (!url) return;
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        const frames = Math.round(video.duration * 30); // 30fps
        handleDesignChange(key, Math.max(15, Math.min(300, frames)));
      }
      video.remove();
    };
    video.onerror = () => video.remove();
    video.src = url;
  }, [handleDesignChange]);

  return (
    <div className="space-y-5">
      {/* Section title */}
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
          <Film size={16} className="text-violet-400" />
          Archivos de Video y Audio
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Sube los videos y audio de tu marca. La posición, duración y estilo se configuran en cada plantilla.
        </p>
      </div>

      {/* ═══ Intro Video ═══ */}
      <VideoUploadSimple
        label="Video de Cabezote (Intro)"
        description="Se usará automáticamente en plantillas que incluyan segmento de intro de marca"
        videoUrl={designMD.introVideoUrl || ''}
        accentColor="#10b981"
        onUrlChange={(url) => {
          handleDesignChange('introVideoUrl', url);
          if (url) probeVideoDuration(url, 'introDurationFrames');
        }}
        onClear={() => {
          handleDesignChange('introVideoUrl', '');
          handleDesignChange('introDurationFrames', 60);
        }}
      />

      {/* ═══ Outro Video ═══ */}
      <VideoUploadSimple
        label="Video de Cierre (Outro)"
        description="Se usará automáticamente en plantillas que incluyan segmento de outro de marca"
        videoUrl={designMD.outroVideoUrl || ''}
        accentColor="#f43f5e"
        onUrlChange={(url) => {
          handleDesignChange('outroVideoUrl', url);
          if (url) probeVideoDuration(url, 'outroDurationFrames');
        }}
        onClear={() => {
          handleDesignChange('outroVideoUrl', '');
          handleDesignChange('outroDurationFrames', 60);
        }}
      />

      {/* ═══ Brand Audio ═══ */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Music size={14} className="text-violet-400" />
            Música / Jingle de Marca
          </label>
          {designMD.brandAudioUrl && (
            <button
              onClick={() => handleDesignChange('brandAudioUrl', '')}
              title="Quitar audio de marca"
              className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-[11px] text-neutral-500 -mt-1">
          Se incluirá como pista de fondo en plantillas de video
        </p>

        <div className="flex gap-3 items-start">
          {/* Preview */}
          <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
            {designMD.brandAudioUrl ? (
              <div className="flex items-end gap-0.5 h-6">
                {[3, 5, 4, 6, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-violet-500 rounded-full animate-pulse"
                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            ) : (
              <Music size={20} className="text-neutral-600" />
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={designMD.brandAudioUrl || ''}
              onChange={(e) => handleDesignChange('brandAudioUrl', e.target.value)}
              className="bg-neutral-950 text-[11px] rounded-lg px-3 py-2 w-full border border-neutral-800 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono text-white"
              placeholder="https://audio.mp3"
            />
            <FileDropZone
              compact
              accept="audio/*"
              label="Subir audio"
              onFiles={(files) => {
                const url = URL.createObjectURL(files[0]);
                handleDesignChange('brandAudioUrl', url);
              }}
            />
          </div>
        </div>

        {/* Volume slider */}
        {designMD.brandAudioUrl && (
          <div className="flex items-center gap-3 pt-1">
            <Volume2 size={12} className="text-neutral-500 shrink-0" />
            <span className="text-[10px] text-neutral-500 shrink-0">Volumen:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((designMD.brandAudioVolume ?? 0.8) * 100)}
              onChange={(e) => handleDesignChange('brandAudioVolume', parseInt(e.target.value) / 100)}
              className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <span className="text-[10px] font-mono text-violet-300 bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">
              {Math.round((designMD.brandAudioVolume ?? 0.8) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Simple Video Upload Card ── */

const VideoUploadSimple: React.FC<{
  label: string;
  description: string;
  videoUrl: string;
  accentColor: string;
  onUrlChange: (url: string) => void;
  onClear: () => void;
}> = ({ label, description, videoUrl, accentColor, onUrlChange, onClear }) => {
  const hasVideo = !!videoUrl && videoUrl.trim().length > 0;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <Film size={14} style={{ color: accentColor }} />
          {label}
        </label>
        {hasVideo && (
          <button
            onClick={onClear}
            title={`Quitar ${label}`}
            className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="text-[11px] text-neutral-500 -mt-1">{description}</p>

      <div className="flex gap-3 items-start">
        {/* Video Preview */}
        <div className="w-28 h-20 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 flex items-center justify-center">
          {hasVideo ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
              onMouseLeave={(e) => {
                const v = e.target as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
          ) : (
            <div className="text-neutral-600 flex flex-col items-center gap-1">
              <Upload size={18} style={{ color: `${accentColor}60` }} />
              <span className="text-[9px]">Sin video</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="bg-neutral-950 text-[11px] rounded-lg px-3 py-2 w-full border border-neutral-800 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono text-white"
            placeholder="https://video.mp4"
          />
          <FileDropZone
            compact
            accept="video/*"
            label="Subir archivo"
            onFiles={(files) => {
              const url = URL.createObjectURL(files[0]);
              onUrlChange(url);
            }}
          />
        </div>
      </div>

      {/* Status badge */}
      {hasVideo && (
        <div
          className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg w-fit"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          Video cargado
        </div>
      )}
    </div>
  );
};
