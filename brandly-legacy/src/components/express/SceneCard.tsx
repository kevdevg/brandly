import React from 'react';
import { Film, Image as ImageIcon, Play, Type, Camera, ChevronRight } from 'lucide-react';
import { ExpressScene } from '../../types';

interface SceneCardProps {
  scene: ExpressScene;
  index: number;
  isActive: boolean;
  onClick: () => void;
  /** Whether any field has user content */
  hasContent: boolean;
  /** Total scenes count */
  totalScenes: number;
}

/** Type badge styles */
const TYPE_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  intro: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', icon: <Film size={10} />, label: 'INTRO' },
  content: { bg: 'bg-violet-500/15', border: 'border-violet-500/40', icon: <Camera size={10} />, label: 'CONTENIDO' },
  outro: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', icon: <Film size={10} />, label: 'OUTRO' },
  transition: { bg: 'bg-sky-500/15', border: 'border-sky-500/40', icon: <Play size={10} />, label: 'TRANSICIÓN' },
};

/**
 * SceneCard — Visual card representing a single scene in the storyboard.
 * Shows scene type, name, duration, and field summary.
 */
export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  isActive,
  onClick,
  hasContent,
  totalScenes,
}) => {
  const typeStyle = TYPE_STYLES[scene.type] || TYPE_STYLES.content;
  const textFields = scene.editableFields.filter(f => f.type === 'text');
  const mediaFields = scene.editableFields.filter(f => f.type === 'media');
  const logoFields = scene.editableFields.filter(f => f.type === 'logo');

  return (
    <div className="flex items-center shrink-0">
      <button
        onClick={onClick}
        title={`${scene.name} — ${scene.durationSeconds}s`}
        className={`relative w-28 h-24 rounded-xl border-2 transition-all overflow-hidden cursor-pointer group shrink-0 ${
          isActive
            ? `${typeStyle.bg} ${typeStyle.border} ring-2 ring-white/10 shadow-lg`
            : `bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50`
        }`}
      >
        {/* Type badge */}
        <div className={`absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold tracking-wider ${
          isActive ? 'text-white bg-black/30' : 'text-neutral-500 bg-neutral-800'
        }`}>
          {typeStyle.icon}
          {typeStyle.label}
        </div>

        {/* Duration */}
        <div className="absolute top-1.5 right-1.5 text-[8px] font-mono text-neutral-500">
          {scene.durationSeconds}s
        </div>

        {/* Scene name */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <div className={`text-[10px] font-semibold truncate ${isActive ? 'text-white' : 'text-neutral-400'}`}>
            {scene.name}
          </div>
          {/* Field summary */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {textFields.length > 0 && (
              <span className="flex items-center gap-0.5 text-[7px] text-neutral-500">
                <Type size={7} /> {textFields.length}
              </span>
            )}
            {mediaFields.length > 0 && (
              <span className="flex items-center gap-0.5 text-[7px] text-neutral-500">
                <ImageIcon size={7} /> {mediaFields.length}
              </span>
            )}
            {logoFields.length > 0 && (
              <span className="flex items-center gap-0.5 text-[7px] text-neutral-500">
                ⚡ {logoFields.length}
              </span>
            )}
          </div>
        </div>

        {/* Content indicator */}
        {hasContent && (
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}

        {/* Scene number */}
        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black transition-opacity ${
          isActive ? 'opacity-10 text-white' : 'opacity-5 text-neutral-400'
        }`}>
          {index + 1}
        </div>
      </button>

      {/* Arrow connector (except last scene) */}
      {index < totalScenes - 1 && (
        <ChevronRight size={14} className="text-neutral-700 mx-1 shrink-0" />
      )}
    </div>
  );
};
