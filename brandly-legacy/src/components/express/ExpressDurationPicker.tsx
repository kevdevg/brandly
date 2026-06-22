import React from 'react';
import { Clock } from 'lucide-react';

interface ExpressDurationPickerProps {
  duration: number;
  onChange: (seconds: number) => void;
  isVideo: boolean;
}

const VIDEO_PRESETS = [5, 10, 15, 20, 30, 60];

/**
 * ExpressDurationPicker — Simple duration selector with presets.
 * Only visible for video templates (image duration is fixed at 1s).
 */
export const ExpressDurationPicker: React.FC<ExpressDurationPickerProps> = ({
  duration,
  onChange,
  isVideo,
}) => {
  if (!isVideo) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Clock size={10} className="text-neutral-500" />
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Duración</span>
        <span className="text-[9px] text-violet-400 font-mono ml-auto">{duration}s</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {VIDEO_PRESETS.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={`${s} segundos`}
            className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
              duration === s
                ? 'bg-violet-600/15 border-violet-500/50 text-violet-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
            }`}
          >
            {s}s
          </button>
        ))}
      </div>
      {/* Visual bar */}
      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
        <div className="bg-amber-500/40 rounded-l-full" style={{ width: '15%' }} title="Intro" />
        <div className="bg-violet-500/40 flex-1" title="Contenido" />
        <div className="bg-amber-500/40 rounded-r-full" style={{ width: '15%' }} title="Outro" />
      </div>
      <div className="flex justify-between text-[7px] text-neutral-600 px-1">
        <span>Intro</span>
        <span>Contenido</span>
        <span>Outro</span>
      </div>
    </div>
  );
};
