import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Optional icon before title */
  icon?: React.ReactNode;
  /** Whether the section starts open */
  defaultOpen?: boolean;
  /** Children rendered inside the collapsible body */
  children: React.ReactNode;
  /** Badge text shown to the right, e.g. "3 activos" */
  badge?: string | number;
  /** Extra className for the outer wrapper */
  className?: string;
}

/**
 * CollapsibleSection — Reusable collapsible panel section.
 * 
 * Used across the app to separate "basic" (always visible) controls from
 * "advanced" (collapsible) ones, reducing visual clutter.
 * 
 * Usage:
 * ```tsx
 * <CollapsibleSection title="Tipografía Avanzada" badge={activeCount}>
 *   <SliderRow label="Altura de línea" ... />
 *   <SliderRow label="Espaciado" ... />
 * </CollapsibleSection>
 * ```
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-t border-neutral-800/50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? `Cerrar ${title}` : `Abrir ${title}`}
        className="w-full flex items-center justify-between py-2.5 px-1 group transition-colors hover:bg-neutral-800/20 rounded-md"
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown
            size={12}
            className={`text-neutral-500 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
          />
          {icon && <span className="text-neutral-400">{icon}</span>}
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider group-hover:text-neutral-200 transition-colors">
            {title}
          </span>
        </div>
        {badge != null && (badge !== 0 && badge !== '') && (
          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
            {typeof badge === 'number' ? `${badge} activo${badge !== 1 ? 's' : ''}` : badge}
          </span>
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100 pb-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-2 px-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};
