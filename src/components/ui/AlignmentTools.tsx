import React from 'react';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';

interface AlignmentToolsProps {
  /** Generic alignment callback — receives the axis values to set */
  onAlign: (updates: { x?: number; y?: number }) => void;
}

/**
 * AlignmentTools — Quick-align element to canvas edges or center.
 * All values are percentages (0-100) matching the x/y coordinate system.
 *
 * Generic interface: works with any data model (TimelineElement, ExpressField, etc.)
 */
export const AlignmentTools: React.FC<AlignmentToolsProps> = ({ onAlign }) => {
  const alignActions = [
    {
      icon: <AlignHorizontalJustifyStart size={14} />,
      label: 'Alinear Izquierda',
      action: () => onAlign({ x: 5 }),
    },
    {
      icon: <AlignHorizontalJustifyCenter size={14} />,
      label: 'Centrar Horizontal',
      action: () => onAlign({ x: 50 }),
    },
    {
      icon: <AlignHorizontalJustifyEnd size={14} />,
      label: 'Alinear Derecha',
      action: () => onAlign({ x: 95 }),
    },
    {
      icon: <AlignVerticalJustifyStart size={14} />,
      label: 'Alinear Arriba',
      action: () => onAlign({ y: 5 }),
    },
    {
      icon: <AlignVerticalJustifyCenter size={14} />,
      label: 'Centrar Vertical',
      action: () => onAlign({ y: 50 }),
    },
    {
      icon: <AlignVerticalJustifyEnd size={14} />,
      label: 'Alinear Abajo',
      action: () => onAlign({ y: 95 }),
    },
  ];

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Alinear</span>
      <div className="flex gap-1">
        {alignActions.map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            title={a.label}
            className="flex-1 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all flex items-center justify-center"
          >
            {a.icon}
          </button>
        ))}
      </div>
      {/* Quick Center Both */}
      <button
        onClick={() => onAlign({ x: 50, y: 50 })}
        title="Centrar en Canvas"
        className="w-full py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-violet-300 hover:border-violet-500/40 transition-all text-[10px] font-medium"
      >
        ⊞ Centrar en Canvas
      </button>
    </div>
  );
};

