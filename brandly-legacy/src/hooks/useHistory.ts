import { useRef, useCallback } from 'react';
import { TimelineElement, TimelineLayer } from '../types';

interface HistoryState {
  timelineElements: TimelineElement[];
  layers: TimelineLayer[];
}

interface UseHistoryReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Call to snapshot current state (call after meaningful user actions) */
  pushSnapshot: () => void;
}

/**
 * Improved history hook using refs to avoid dependency loops.
 * Uses command-style snapshots instead of automatic effect-based recording.
 */
export function useHistory(
  timelineElements: TimelineElement[],
  layers: TimelineLayer[],
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>,
  setLayers: React.Dispatch<React.SetStateAction<TimelineLayer[]>>
): UseHistoryReturn {
  const historyRef = useRef<HistoryState[]>([{ timelineElements, layers }]);
  const indexRef = useRef(0);
  // Track if we're currently performing an undo/redo to skip auto-snapshot
  const isRestoringRef = useRef(false);
  // Debounce timer for auto-snapshots
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-snapshot on changes (debounced)
  const currentStateRef = useRef({ timelineElements, layers });
  currentStateRef.current = { timelineElements, layers };

  // Schedule a debounced snapshot when state changes
  const scheduleSnapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = currentStateRef.current;
      const lastState = historyRef.current[indexRef.current];
      const currentStr = JSON.stringify(current);
      const lastStr = JSON.stringify(lastState);
      
      if (currentStr !== lastStr) {
        // Truncate any future states (from previous undos)
        const newHistory = historyRef.current.slice(0, indexRef.current + 1);
        newHistory.push(current);
        // Keep max 50 states
        if (newHistory.length > 50) newHistory.shift();
        historyRef.current = newHistory;
        indexRef.current = newHistory.length - 1;
      }
    }, 400);
  }, []);

  // Call scheduleSnapshot whenever state changes
  // This is stable because it uses refs internally
  if (!isRestoringRef.current) {
    scheduleSnapshot();
  }

  const pushSnapshot = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const current = currentStateRef.current;
    const newHistory = historyRef.current.slice(0, indexRef.current + 1);
    newHistory.push({ ...current });
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    indexRef.current = newHistory.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      isRestoringRef.current = true;
      indexRef.current -= 1;
      const prevState = historyRef.current[indexRef.current];
      setTimelineElements(prevState.timelineElements);
      setLayers(prevState.layers);
      // Reset flag after React processes the state update
      requestAnimationFrame(() => { isRestoringRef.current = false; });
    }
  }, [setTimelineElements, setLayers]);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      isRestoringRef.current = true;
      indexRef.current += 1;
      const nextState = historyRef.current[indexRef.current];
      setTimelineElements(nextState.timelineElements);
      setLayers(nextState.layers);
      requestAnimationFrame(() => { isRestoringRef.current = false; });
    }
  }, [setTimelineElements, setLayers]);

  return {
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    pushSnapshot,
  };
}
