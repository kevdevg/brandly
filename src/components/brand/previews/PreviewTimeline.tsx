import React from 'react';
import { Film, Volume2, Monitor, Square, Smartphone } from 'lucide-react';
import { DesignMD } from '../../../types';

interface PreviewTimelineProps {
  designMD: DesignMD;
  aspectRatio?: '16:9' | '1:1' | '9:16';
}

const RATIO_INFO: Record<string, { icon: React.ReactNode; res: string; label: string }> = {
  '16:9': { icon: <Monitor size={12} />, res: '1920×1080', label: 'Landscape' },
  '1:1': { icon: <Square size={12} />, res: '1080×1080', label: 'Cuadrado' },
  '9:16': { icon: <Smartphone size={12} />, res: '1080×1920', label: 'Vertical' },
};



/**
 * Visual timeline mockup showing the video structure:
 * intro → transition → content → transition → outro + audio status.
 */
export const PreviewTimeline: React.FC<PreviewTimelineProps> = ({ designMD, aspectRatio = '9:16' }) => {
  const hasIntro = !!designMD.introVideoUrl;
  const hasOutro = !!designMD.outroVideoUrl;
  const hasAudio = !!designMD.brandAudioUrl;
  const introDur = designMD.introDurationFrames || 60;
  const outroDur = designMD.outroDurationFrames || 60;
  const totalDur = (hasIntro ? introDur : 0) + (hasOutro ? outroDur : 0) || 1;


  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Timeline Blocks */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Estructura del Video</h4>
          <span className="text-[10px] font-mono text-neutral-600 flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md">
            {RATIO_INFO[aspectRatio]?.icon}
            {aspectRatio} · {RATIO_INFO[aspectRatio]?.res}
          </span>
        </div>

        {/* Timeline visual */}
        <div className="flex items-center gap-1.5">
          {/* Intro */}
          {hasIntro && (
              <TimelineBlock
                label="INTRO"
                icon={<Film size={14} />}
                duration={introDur}
                color={designMD.primaryColor}
                widthPercent={(introDur / totalDur) * 100}
              />
          )}


          {/* Outro */}
          {hasOutro && (
              <TimelineBlock
                label="OUTRO"
                icon={<Film size={14} />}
                duration={outroDur}
                color={designMD.primaryColor}
                widthPercent={(outroDur / totalDur) * 100}
              />
          )}
        </div>

        {/* Duration */}
        <div className="flex justify-between text-[10px] font-mono text-neutral-500">
          <span>0:00</span>
          <span>{(totalDur / 30).toFixed(1)}s · {RATIO_INFO[aspectRatio]?.label} · 30fps</span>
        </div>
      </div>


      {/* Audio Status */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-3">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Audio de Marca</h4>

        {hasAudio ? (
          <div className="space-y-3">
            {/* Audio waveform mockup */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Volume2 size={18} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-end gap-[2px] h-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-violet-500/60"
                      style={{
                        height: `${Math.max(2, Math.sin(i * 0.4) * 16 + Math.random() * 8 + 4)}px`,
                        opacity: getWaveformOpacity(i, 32, designMD),
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 font-mono truncate">
                  {designMD.brandAudioUrl?.split('/').pop() || 'audio.mp3'}
                </p>
              </div>
              <span className="text-xs font-mono text-violet-300 bg-neutral-800 px-2 py-1 rounded">
                {Math.round((designMD.brandAudioVolume ?? 0.8) * 100)}%
              </span>
            </div>

            {/* Fade indicators */}
            <div className="flex gap-4">
              {designMD.autoFadeInAudio && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                  ↗ Fade-In {((designMD.audioFadeInDuration || 15) / 30).toFixed(1)}s
                </span>
              )}
              {designMD.autoFadeOutAudio && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                  ↘ Fade-Out {((designMD.audioFadeOutDuration || 15) / 30).toFixed(1)}s
                </span>
              )}
              {!designMD.autoFadeInAudio && !designMD.autoFadeOutAudio && (
                <span className="text-[10px] text-neutral-500">Sin fade automático</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Volume2 size={24} className="mx-auto text-neutral-700 mb-2" />
            <p className="text-xs text-neutral-500">Sin audio de marca configurado</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───

const TimelineBlock: React.FC<{
  label: string;
  icon: React.ReactNode;
  duration: number;
  color: string;
  widthPercent: number;
  isMain?: boolean;
}> = ({ label, icon, duration, color, widthPercent, isMain }) => (
  <div
    className="rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all"
    style={{
      backgroundColor: `${color}${isMain ? '30' : '50'}`,
      border: `1px solid ${color}60`,
      flex: `${widthPercent} 0 0`,
      minWidth: '70px',
    }}
  >
    <span style={{ color }} className="mb-1">{icon}</span>
    <span className="text-[9px] font-bold tracking-wider text-white opacity-80">{label}</span>
    <span className="text-[9px] font-mono text-neutral-400 mt-0.5">{(duration / 30).toFixed(1)}s</span>
  </div>
);




function getWaveformOpacity(i: number, total: number, designMD: DesignMD): number {
  let opacity = 1;
  const fadeInFrames = designMD.audioFadeInDuration || 15;
  const fadeOutFrames = designMD.audioFadeOutDuration || 15;
  const fadeInBars = Math.ceil((fadeInFrames / 300) * total);
  const fadeOutBars = Math.ceil((fadeOutFrames / 300) * total);

  if (designMD.autoFadeInAudio && i < fadeInBars) {
    opacity = i / fadeInBars;
  }
  if (designMD.autoFadeOutAudio && i > total - fadeOutBars) {
    opacity = (total - i) / fadeOutBars;
  }
  return Math.max(0.1, opacity);
}
