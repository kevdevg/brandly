import React, { useState, useEffect } from 'react';
import { Check, Loader2, Save } from 'lucide-react';

interface AutoSaveIndicatorProps {
  /** Timestamp of last save (Date.now()) */
  lastSaved: number | null;
  /** Whether a save is currently in progress */
  isSaving?: boolean;
}

/**
 * AutoSaveIndicator — Shows a subtle indicator of auto-save status.
 * Displays a checkmark when recently saved, fades after a few seconds.
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving = false,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSaved) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  if (!visible && !isSaving) return null;

  return (
    <div
      className={`absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md 
        bg-neutral-950/60 backdrop-blur-sm border border-neutral-800/30
        transition-opacity duration-500 ${visible || isSaving ? 'opacity-100' : 'opacity-0'}`}
    >
      {isSaving ? (
        <>
          <Loader2 size={10} className="text-amber-400 animate-spin" />
          <span className="text-[8px] text-amber-400 font-medium">Guardando...</span>
        </>
      ) : (
        <>
          <Check size={10} className="text-emerald-400" />
          <span className="text-[8px] text-emerald-400/80 font-medium">Guardado</span>
        </>
      )}
    </div>
  );
};
