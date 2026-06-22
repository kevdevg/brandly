import React, { useMemo } from 'react';
import { BarChart3, Layers, Clock, Film, Type, Image, Video, Music } from 'lucide-react';
import { TimelineElement, TimelineLayer } from '../../types';

interface ProjectStatsProps {
  timelineElements: TimelineElement[];
  layers: TimelineLayer[];
  durationInFrames: number;
  fps: number;
}

/**
 * ProjectStats — Displays compact project statistics:
 * element count by type, layer count, total duration, etc.
 */
export const ProjectStats: React.FC<ProjectStatsProps> = ({
  timelineElements,
  layers,
  durationInFrames,
  fps,
}) => {
  const stats = useMemo(() => {
    const userElements = timelineElements.filter(e => !e.isBrandElement);
    const typeCounts: Record<string, number> = {};
    userElements.forEach(el => {
      typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
    });

    const totalDuration = durationInFrames / fps;
    const longestEl = userElements.reduce((max, el) =>
      (el.endFrame - el.startFrame) > (max.endFrame - max.startFrame) ? el : max
    , userElements[0]);

    return {
      total: userElements.length,
      typeCounts,
      layerCount: layers.length,
      durationSec: totalDuration,
      longestName: longestEl?.elementName || longestEl?.type || '—',
      longestDur: longestEl ? ((longestEl.endFrame - longestEl.startFrame) / fps).toFixed(1) : '0',
    };
  }, [timelineElements, layers, durationInFrames, fps]);

  const typeIcons: Record<string, React.ReactNode> = {
    text: <Type size={8} className="text-violet-400" />,
    image: <Image size={8} className="text-sky-400" />,
    video: <Video size={8} className="text-rose-400" />,
    audio: <Music size={8} className="text-amber-400" />,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <BarChart3 size={12} className="text-violet-400" />
        <span className="text-[10px] font-semibold text-white">Estadísticas del Proyecto</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div className="bg-neutral-950 border border-neutral-800/50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-white">{stats.total}</div>
          <div className="text-[7px] text-neutral-500 uppercase">Elementos</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800/50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-white">{stats.layerCount}</div>
          <div className="text-[7px] text-neutral-500 uppercase">Capas</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800/50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-white">{stats.durationSec.toFixed(1)}s</div>
          <div className="text-[7px] text-neutral-500 uppercase">Duración</div>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(stats.typeCounts).map(([type, count]) => (
          <span
            key={type}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800/50 text-[7px] text-neutral-400"
            title={`${count} elemento(s) de tipo ${type}`}
          >
            {typeIcons[type] || <span className="w-2" />}
            {type}: {count}
          </span>
        ))}
      </div>

      {/* Longest element */}
      {stats.total > 0 && (
        <div className="text-[8px] text-neutral-600">
          <Clock size={8} className="inline mr-1" />
          Más largo: <span className="text-neutral-400">{stats.longestName}</span> ({stats.longestDur}s)
        </div>
      )}
    </div>
  );
};
