import React, { RefObject } from 'react';
import { Music } from 'lucide-react';
import { TimelineElement } from '../../types';
import { PlayerRef } from '@remotion/player';
import { uploadMedia } from '../../utils/mediaUploader';
import { FileDropZone } from '../ui/FileDropZone';
import { getAudioDuration, durationToFrames } from '../../utils/audioMetadata';

interface AudioLayerPanelProps {
  activeLayerId: string;
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  timelineElements: TimelineElement[];
  playerRef: RefObject<PlayerRef | null>;
  endFrameLimit?: number;
}

export const AudioLayerPanel: React.FC<AudioLayerPanelProps> = ({
  activeLayerId,
  setTimelineElements,
  timelineElements,
  playerRef,
  endFrameLimit = 150
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-neutral-800">
        <h2 className="text-sm font-bold text-white mb-1">
          <Music size={16} className="inline mr-2 text-violet-400 align-text-bottom"/> Capa de Audio
        </h2>
        <p className="text-[11px] text-neutral-400">Añade o edita pistas de audio</p>
      </div>
      <div className="p-5 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">Añadir Audio (MP3/WAV)</label>
          <FileDropZone
            accept="audio/*"
            label="Subir Audio"
            sublabel="MP3, WAV o M4A — o arrastra aquí"
            onFiles={async (files) => {
              const file = files[0];
              if (!file || !playerRef.current) return;
              try {
                const result = await uploadMedia(file);
                const currentFrame = playerRef.current.getCurrentFrame() || 0;
                
                // Get real audio duration
                let endFrame = Math.min(endFrameLimit, currentFrame + 150);
                try {
                  const dur = await getAudioDuration(result.url);
                  endFrame = currentFrame + durationToFrames(dur);
                } catch {}
                
                setTimelineElements(prev => [...prev, {
                  id: Date.now().toString(),
                  layerId: activeLayerId,
                  type: 'audio',
                  content: result.url,
                  startFrame: currentFrame,
                  endFrame,
                  x: 0,
                  y: 0,
                  originalFileName: result.originalName,
                }]);
              } catch (err) {
                console.error('Audio upload failed:', err);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
