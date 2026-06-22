import React from 'react';
import { FolderOpen, Type, Stamp, Music, Settings2, Hexagon, HelpCircle, Disc3 } from 'lucide-react';

export type PanelType = 'media' | 'text' | 'stickers' | 'shapes' | 'audio' | 'sfx' | null;

interface StudioToolbarProps {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  onShowShortcuts?: () => void;
  outputFormat?: 'video' | 'image';
}

/**
 * CapCut-style sidebar toolbar (56px wide).
 * Each button toggles a sliding panel on the right side.
 * Always visible — no buttons change or disappear based on layer type.
 */
export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  activePanel,
  setActivePanel,
  onShowShortcuts,
  outputFormat,
}) => {
  const ToolButton = ({ panel, icon, label }: { panel: PanelType; icon: React.ReactNode; label: string }) => {
    const isActive = activePanel === panel;
    return (
      <button
        onClick={() => setActivePanel(isActive ? null : panel)}
        title={label}
        className={`relative w-full flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${
          isActive
            ? 'text-white bg-neutral-800/70'
            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30'
        }`}
      >
        {/* Active accent line */}
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-violet-500 rounded-r" />
        )}
        {icon}
        <span className="text-[8px] font-medium leading-none mt-0.5">{label}</span>
      </button>
    );
  };

  return (
    <div className="w-14 bg-neutral-900 border-r border-neutral-800/60 flex flex-col items-center z-20 shrink-0">
      <ToolButton
        panel="media"
        icon={<FolderOpen size={18} />}
        label="Media"
      />
      <ToolButton
        panel="text"
        icon={<Type size={18} />}
        label="Texto"
      />
      <ToolButton
        panel="stickers"
        icon={<Stamp size={18} />}
        label="Marca"
      />
      <ToolButton
        panel="shapes"
        icon={<Hexagon size={18} />}
        label="Formas"
      />
      {outputFormat !== 'image' && (
        <ToolButton
          panel="audio"
          icon={<Music size={18} />}
          label="Audio"
        />
      )}
      {outputFormat !== 'image' && (
        <ToolButton
          panel="sfx"
          icon={<Disc3 size={18} />}
          label="SFX"
        />
      )}

      <div className="flex-1" />

      {/* Help */}
      <button
        onClick={onShowShortcuts}
        title="Atajos de Teclado (?)"
        className="relative w-full flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/30"
      >
        <HelpCircle size={18} />
        <span className="text-[8px] font-medium leading-none mt-0.5">Ayuda</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => setActivePanel(null)}
        title="Cerrar Paneles"
        className={`relative w-full flex flex-col items-center justify-center gap-0.5 py-2.5 mb-1 transition-all ${
          activePanel === null
            ? 'text-white bg-neutral-800/60'
            : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/30'
        }`}
      >
        <Settings2 size={18} />
        <span className="text-[8px] font-medium leading-none mt-0.5">Ajustes</span>
      </button>
    </div>
  );
};
