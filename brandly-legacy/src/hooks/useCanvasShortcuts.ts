import React from 'react';
import { useEffect } from 'react';

/**
 * useCanvasShortcuts — Keyboard shortcuts for canvas zoom.
 * Handles Cmd+= (zoom in), Cmd+- (zoom out), Cmd+0 (reset zoom).
 */
export function useCanvasShortcuts(
  setCanvasZoom: React.Dispatch<React.SetStateAction<number>>,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;

      const isMeta = e.ctrlKey || e.metaKey;

      if (isMeta && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setCanvasZoom(prev => Math.min(5, prev + 0.25));
      } else if (isMeta && e.key === '-') {
        e.preventDefault();
        setCanvasZoom(prev => Math.max(0.1, prev - 0.25));
      } else if (isMeta && e.key === '0') {
        e.preventDefault();
        setCanvasZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, setCanvasZoom]);
}
