import React from 'react';
import { Copy, Trash2, Lock, Unlock, Scissors, Layers, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { TimelineElement } from '../../types';

interface ElementContextMenuProps {
  elementId: string;
  x: number;
  y: number;
  element: TimelineElement;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSplit: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, danger, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] rounded-md transition-colors ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : disabled
          ? 'text-neutral-600 cursor-not-allowed'
          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

/**
 * ElementContextMenu — right-click context menu for timeline elements.
 * Actions: Duplicate, Split, Lock/Unlock, Move Forward/Backward, Delete.
 */
export const ElementContextMenu: React.FC<ElementContextMenuProps> = ({
  elementId,
  x,
  y,
  element,
  onClose,
  onDuplicate,
  onDelete,
  onToggleLock,
  onSplit,
  onBringForward,
  onSendBackward,
}) => {
  const isBrand = element.isBrandElement;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      {/* Menu */}
      <div
        className="fixed z-[61] bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl shadow-black/60 py-1.5 px-1 min-w-[180px] animate-in"
        style={{ left: x, top: y }}
      >
        <MenuItem
          icon={<Copy size={13} />}
          label="Duplicar"
          onClick={() => { onDuplicate(elementId); onClose(); }}
          disabled={isBrand}
        />
        <MenuItem
          icon={<Scissors size={13} />}
          label="Dividir en Playhead"
          onClick={() => { onSplit(elementId); onClose(); }}
          disabled={isBrand}
        />
        <div className="my-1 border-t border-neutral-800/50" />
        <MenuItem
          icon={element.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
          label={element.isLocked ? "Desbloquear" : "Bloquear"}
          onClick={() => { onToggleLock(elementId); onClose(); }}
          disabled={isBrand}
        />
        <MenuItem
          icon={<ArrowUp size={13} />}
          label="Mover Adelante"
          onClick={() => { onBringForward(elementId); onClose(); }}
        />
        <MenuItem
          icon={<ArrowDown size={13} />}
          label="Mover Atrás"
          onClick={() => { onSendBackward(elementId); onClose(); }}
        />
        <div className="my-1 border-t border-neutral-800/50" />
        <MenuItem
          icon={<Trash2 size={13} />}
          label="Eliminar"
          onClick={() => { onDelete(elementId); onClose(); }}
          danger
          disabled={isBrand}
        />
      </div>
    </>
  );
};
