import React, { useState, useEffect, useRef, RefObject } from 'react';
import { TimelineElement } from '../../types';

interface CanvasDragState {
  id: string;
  startX: number;
  startY: number;
  initialElX: number;
  initialElY: number;
}

interface TransformDragState {
  id: string;
  type: 'scale' | 'rotate';
  startX: number;
  startY: number;
  initialScale: number;
  initialRot: number;
  centerX: number;
  centerY: number;
}

interface TempPosition {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
}

interface Guides {
  x: number | null;
  y: number | null;
}

interface UseCanvasDragReturn {
  containerRef: RefObject<HTMLDivElement>;
  dragState: CanvasDragState | null;
  setDragState: React.Dispatch<React.SetStateAction<CanvasDragState | null>>;
  transformDragState: TransformDragState | null;
  setTransformDragState: React.Dispatch<React.SetStateAction<TransformDragState | null>>;
  tempPositions: Record<string, TempPosition>;
  guides: Guides;
}

export function useCanvasDrag(
  timelineElements: TimelineElement[],
  onElementPositionChange?: (id: string, x: number, y: number) => void,
  onElementTransformChange?: (id: string, updates: Partial<TimelineElement>) => void
): UseCanvasDragReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<CanvasDragState | null>(null);
  const [transformDragState, setTransformDragState] = useState<TransformDragState | null>(null);
  const [guides, setGuides] = useState<Guides>({ x: null, y: null });
  const [tempPositions, setTempPositions] = useState<Record<string, TempPosition>>({});

  // Stable refs to avoid effect re-runs
  const tempPositionsRef = useRef(tempPositions);
  tempPositionsRef.current = tempPositions;
  const elementsRef = useRef(timelineElements);
  elementsRef.current = timelineElements;
  const onPosChangeRef = useRef(onElementPositionChange);
  onPosChangeRef.current = onElementPositionChange;
  const onTransformChangeRef = useRef(onElementTransformChange);
  onTransformChangeRef.current = onElementTransformChange;

  useEffect(() => {
    if (!dragState && !transformDragState) return;

    let rafId: number | null = null;
    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) return; // Throttle to 60fps via rAF
      rafId = requestAnimationFrame(() => {
        rafId = null;
        handleDragUpdate(e);
      });
    };

    const handleDragUpdate = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (transformDragState) {
        if (transformDragState.type === 'scale') {
          // Distance-from-center approach: works correctly from ANY corner.
          // Compare distance from element center at start vs now.
          const startDist = Math.sqrt(
            Math.pow(transformDragState.startX - transformDragState.centerX, 2) +
            Math.pow(transformDragState.startY - transformDragState.centerY, 2)
          );
          const currentDist = Math.sqrt(
            Math.pow(e.clientX - transformDragState.centerX, 2) +
            Math.pow(e.clientY - transformDragState.centerY, 2)
          );
          
          // Ratio: if pointer moves farther from center → bigger, closer → smaller
          const distRatio = startDist > 0 ? currentDist / startDist : 1;
          const ratio = Math.max(0.05, transformDragState.initialScale * distRatio);
          
          const el = elementsRef.current.find(e => e.id === transformDragState.id);
          setTempPositions(prev => ({
            ...prev,
            [transformDragState.id]: {
              x: prev[transformDragState.id]?.x ?? el?.x ?? 50,
              y: prev[transformDragState.id]?.y ?? el?.y ?? 50,
              scale: ratio,
              rotation: prev[transformDragState.id]?.rotation,
            }
          }));
        } else if (transformDragState.type === 'rotate') {
          const currentAngle = Math.atan2(e.clientY - transformDragState.centerY, e.clientX - transformDragState.centerX);
          const initialAngle = Math.atan2(transformDragState.startY - transformDragState.centerY, transformDragState.startX - transformDragState.centerX);
          const diff = (currentAngle - initialAngle) * (180 / Math.PI);
          const newRot = transformDragState.initialRot + diff;
          
          const el = elementsRef.current.find(e => e.id === transformDragState.id);
          setTempPositions(prev => ({
            ...prev,
            [transformDragState.id]: {
              x: prev[transformDragState.id]?.x ?? el?.x ?? 50,
              y: prev[transformDragState.id]?.y ?? el?.y ?? 50,
              scale: prev[transformDragState.id]?.scale,
              rotation: newRot,
            }
          }));
        }
        return;
      }

      if (dragState) {
        // Convert pixel delta to percentage of container
        const dxPct = (rect.width > 0) ? ((e.clientX - dragState.startX) / rect.width) * 100 : 0;
        const dyPct = (rect.height > 0) ? ((e.clientY - dragState.startY) / rect.height) * 100 : 0;
        
        let newX = dragState.initialElX + dxPct;
        let newY = dragState.initialElY + dyPct;

        // Allow elements to go slightly out of bounds for edge positioning
        newX = Math.max(-20, Math.min(120, newX));
        newY = Math.max(-20, Math.min(120, newY));

        // Snapping logic (Smart Guides)
        let snapX: number | null = null;
        let snapY: number | null = null;
        const snapThreshold = 1.5;
        
        // Snap to center
        if (Math.abs(newX - 50) < snapThreshold) { newX = 50; snapX = 50; }
        if (Math.abs(newY - 50) < snapThreshold) { newY = 50; snapY = 50; }
        // Snap to edges
        if (Math.abs(newX) < snapThreshold) { newX = 0; snapX = 0; }
        if (Math.abs(newX - 100) < snapThreshold) { newX = 100; snapX = 100; }
        if (Math.abs(newY) < snapThreshold) { newY = 0; snapY = 0; }
        if (Math.abs(newY - 100) < snapThreshold) { newY = 100; snapY = 100; }
        // Snap to quarter grid (25%, 75%)
        for (const q of [25, 75]) {
          if (Math.abs(newX - q) < snapThreshold) { newX = q; snapX = q; }
          if (Math.abs(newY - q) < snapThreshold) { newY = q; snapY = q; }
        }
        
        // Snap to other elements (center and edges)
        elementsRef.current.forEach(el => {
          if (el.id !== dragState.id) {
            // Center snap
            if (Math.abs(newX - el.x) < snapThreshold) { newX = el.x; snapX = el.x; }
            if (Math.abs(newY - el.y) < snapThreshold) { newY = el.y; snapY = el.y; }
          }
        });

        setGuides({ x: snapX, y: snapY });

        setTempPositions(prev => ({
          ...prev,
          [dragState.id]: {
            ...prev[dragState.id],
            x: newX,
            y: newY
          }
        }));
      }
    };

    const handlePointerUp = () => {
      const temps = tempPositionsRef.current;
      if (transformDragState && onTransformChangeRef.current) {
        const temp = temps[transformDragState.id];
        if (temp) {
          const updates: Partial<TimelineElement> = {};
          if (temp.scale !== undefined) updates.scale = temp.scale;
          if (temp.rotation !== undefined) updates.rotation = temp.rotation;
          onTransformChangeRef.current(transformDragState.id, updates);
        }
      } else if (dragState && onPosChangeRef.current && temps[dragState.id]) {
        onPosChangeRef.current(
          dragState.id, 
          temps[dragState.id].x,
          temps[dragState.id].y
        );
      }
      
      const currentDragId = dragState?.id;
      const currentTransformId = transformDragState?.id;
      
      setDragState(null);
      setTransformDragState(null);
      setGuides({ x: null, y: null });
      
      // Clean up temp positions after a short delay to avoid flicker
      setTimeout(() => setTempPositions(prev => {
        const next = { ...prev };
        if (currentDragId) delete next[currentDragId];
        if (currentTransformId) delete next[currentTransformId];
        return next;
      }), 30);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, transformDragState]);

  return {
    containerRef,
    dragState,
    setDragState,
    transformDragState,
    setTransformDragState,
    tempPositions,
    guides,
  };
}
