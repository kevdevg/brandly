import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Loader2, Cloud, CloudOff } from 'lucide-react';

interface SaveIndicatorProps {
  /** Data to watch for changes — triggers save on change */
  data: unknown;
  /** Storage key for localStorage */
  storageKey: string;
  /** Debounce delay in ms */
  debounceMs?: number;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

/**
 * SaveIndicator — Shows auto-save status and persists data to localStorage.
 * Renders a small pill with icon + text showing current save state.
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  data,
  storageKey,
  debounceMs = 1500,
}) => {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus('unsaved');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setStatus('saving');
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setStatus('saved');
      } catch (e) {
        console.warn('Auto-save failed:', e);
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, storageKey, debounceMs]);

  const config: Record<SaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
    saved: {
      icon: <Check size={10} />,
      label: 'Guardado',
      className: 'text-emerald-400/60 bg-emerald-500/5 border-emerald-500/10',
    },
    saving: {
      icon: <Loader2 size={10} className="animate-spin" />,
      label: 'Guardando...',
      className: 'text-amber-400/60 bg-amber-500/5 border-amber-500/10',
    },
    unsaved: {
      icon: <Cloud size={10} />,
      label: 'Sin guardar',
      className: 'text-neutral-500 bg-neutral-900/50 border-neutral-800',
    },
    error: {
      icon: <CloudOff size={10} />,
      label: 'Error',
      className: 'text-red-400/60 bg-red-500/5 border-red-500/10',
    },
  };

  const { icon, label, className } = config[status];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-medium transition-colors ${className}`}
      title={`Estado: ${label}`}
    >
      {icon}
      {label}
    </div>
  );
};
