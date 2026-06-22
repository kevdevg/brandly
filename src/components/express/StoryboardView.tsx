import React from 'react';
import { Clock } from 'lucide-react';
import { ExpressScene } from '../../types';
import { SceneCard } from './SceneCard';

interface StoryboardViewProps {
  scenes: ExpressScene[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  fieldData: Record<string, string>;
  totalDuration: number;
}

/**
 * StoryboardView — Horizontal strip of scene cards.
 * This IS the "timeline" for Express — no video editor needed.
 * User clicks a scene to edit its fields in the right panel.
 */
export const StoryboardView: React.FC<StoryboardViewProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  fieldData,
  totalDuration,
}) => {
  return (
    <div className="bg-neutral-900/80 border-t border-neutral-800/60 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/40">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Escenas</span>
          <span className="text-[9px] text-neutral-600 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">
            {scenes.length} escenas
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-neutral-600" />
          <span className="text-[9px] text-neutral-500 font-mono">{totalDuration}s total</span>
        </div>
      </div>

      {/* Scene cards strip */}
      <div className="flex items-center overflow-x-auto px-4 py-3 gap-0 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
        {scenes.map((scene, i) => {
          const hasContent = scene.editableFields.some(
            f => fieldData[f.id]?.trim()
          );
          return (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={i}
              isActive={activeSceneId === scene.id}
              onClick={() => onSelectScene(scene.id)}
              hasContent={hasContent}
              totalScenes={scenes.length}
            />
          );
        })}
      </div>
    </div>
  );
};
