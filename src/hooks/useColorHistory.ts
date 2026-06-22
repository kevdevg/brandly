import { useState, useCallback } from 'react';

const MAX_HISTORY = 12;
const STORAGE_KEY = 'editor-color-history';

/**
 * useColorHistory — Tracks recently used colors in localStorage.
 * Returns [recentColors, addColor] for use in any color picker.
 */
export function useColorHistory() {
  const [colors, setColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addColor = useCallback((color: string) => {
    setColors(prev => {
      const normalized = color.toLowerCase();
      const filtered = prev.filter(c => c.toLowerCase() !== normalized);
      const next = [color, ...filtered].slice(0, MAX_HISTORY);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { recentColors: colors, addColor } as const;
}
