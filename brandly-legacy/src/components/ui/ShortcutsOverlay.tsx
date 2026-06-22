import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; desc: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Reproducción',
    shortcuts: [
      { keys: ['Espacio'], desc: 'Play / Pausa' },
      { keys: ['←'], desc: 'Frame anterior' },
      { keys: ['→'], desc: 'Frame siguiente' },
      { keys: ['Home'], desc: 'Ir al inicio' },
      { keys: ['End'], desc: 'Ir al final' },
    ],
  },
  {
    title: 'Edición',
    shortcuts: [
      { keys: ['⌘', 'Z'], desc: 'Deshacer' },
      { keys: ['⌘', '⇧', 'Z'], desc: 'Rehacer' },
      { keys: ['⌘', 'C'], desc: 'Copiar elemento' },
      { keys: ['⌘', 'V'], desc: 'Pegar elemento' },
      { keys: ['⌘', '⌥', 'C'], desc: 'Copiar estilo' },
      { keys: ['⌘', '⌥', 'V'], desc: 'Pegar estilo' },
      { keys: ['D'], desc: 'Duplicar elemento' },
      { keys: ['Supr / ⌫'], desc: 'Eliminar elemento' },
    ],
  },
  {
    title: 'Timeline',
    shortcuts: [
      { keys: ['S'], desc: 'Dividir clip (Split)' },
      { keys: ['M'], desc: 'Añadir marcador' },
    ],
  },
  {
    title: 'Canvas',
    shortcuts: [
      { keys: ['⌘', '+'], desc: 'Zoom in' },
      { keys: ['⌘', '−'], desc: 'Zoom out' },
      { keys: ['Ctrl', 'Scroll'], desc: 'Zoom con rueda' },
      { keys: ['Espacio', 'Drag'], desc: 'Pan / Mover canvas' },
      { keys: ['G'], desc: 'Grilla (regla de tercios)' },
      { keys: ['⇧', 'S'], desc: 'Zona segura' },
    ],
  },
  {
    title: 'Elementos',
    shortcuts: [
      { keys: ['↑↓←→'], desc: 'Mover elemento (1%)' },
      { keys: ['⇧', '↑↓←→'], desc: 'Mover elemento (5%)' },
      { keys: ['⌘', 'F'], desc: 'Buscar elementos' },
    ],
  },
];

/**
 * ShortcutsOverlay — Full-screen modal showing all keyboard shortcuts.
 * Triggered with ? key or from a help button.
 */
export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-[640px] max-h-[80vh] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <Keyboard size={18} className="text-violet-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Atajos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.desc}
                    className="flex items-center justify-between py-1 group"
                  >
                    <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 transition-colors">
                      {shortcut.desc}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center rounded-md bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-neutral-600">
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono">?</kbd> para abrir/cerrar
          </span>
        </div>
      </div>
    </div>
  );
};
