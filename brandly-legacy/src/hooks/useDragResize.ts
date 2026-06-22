import React, { useState, useCallback, RefObject } from 'react';

interface DragResizeOptions {
  /** Ref to the container element for calculating percentage-based positions */
  containerRef: RefObject<HTMLElement>;
  /** Called during move with clamped percentage coordinates */
  onMove: (id: string, x: number, y: number) => void;
  /** Called during resize with clamped percentage dimensions */
  onResize?: (id: string, w: number, h: number) => void;
  /** Snap lines in percentage (e.g. [50] for center snap) */
  snapLines?: number[];
  /** Distance in % to trigger snap (default: 1.5) */
  snapThreshold?: number;
  /** Minimum size in % (default: 5) */
  minSize?: number;
}

interface DragState {
  clientX: number;
  clientY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

/**
 * useDragResize — Shared hook for pointer-based drag & resize on a canvas.
 *
 * Encapsulates the common pattern used across all editors:
 * pointerDown → capture → store start → pointerMove → calculate delta % → clamp → pointerUp → clear.
 *
 * Positions are always percentage-based (0–100) relative to containerRef.
 */
export function useDragResize({
  containerRef,
  onMove,
  onResize,
  snapLines = [],
  snapThreshold = 1.5,
  minSize = 5,
}: DragResizeOptions) {
  const [mode, setMode] = useState<'move' | 'resize' | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<DragState | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number }>({});

  const startDrag = useCallback((
    e: React.PointerEvent,
    id: string,
    origPos: { x: number; y: number; w: number; h: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setMode('move');
    setActiveId(id);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      origX: origPos.x,
      origY: origPos.y,
      origW: origPos.w,
      origH: origPos.h,
    });
  }, []);

  const startResize = useCallback((
    e: React.PointerEvent,
    id: string,
    origPos: { x: number; y: number; w: number; h: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setMode('resize');
    setActiveId(id);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      origX: origPos.x,
      origY: origPos.y,
      origW: origPos.w,
      origH: origPos.h,
    });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!mode || !activeId || !dragStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - dragStart.clientX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragStart.clientY) / rect.height) * 100;

    if (mode === 'move') {
      let newX = Math.max(0, Math.min(100, dragStart.origX + deltaXPct));
      let newY = Math.max(0, Math.min(100, dragStart.origY + deltaYPct));

      // Snap to guides
      const guides: { x?: number; y?: number } = {};
      for (const snap of snapLines) {
        if (Math.abs(newX - snap) < snapThreshold) { newX = snap; guides.x = snap; }
        if (Math.abs(newY - snap) < snapThreshold) { newY = snap; guides.y = snap; }
      }
      setSnapGuides(guides);

      onMove(
        activeId,
        Math.round(newX * 10) / 10,
        Math.round(newY * 10) / 10,
      );
    } else if (mode === 'resize' && onResize) {
      const newW = Math.max(minSize, Math.min(100, dragStart.origW + deltaXPct));
      const newH = Math.max(minSize, Math.min(100, dragStart.origH + deltaYPct));
      setSnapGuides({});

      onResize(
        activeId,
        Math.round(newW * 10) / 10,
        Math.round(newH * 10) / 10,
      );
    }
  }, [mode, activeId, dragStart, containerRef, onMove, onResize, snapLines, snapThreshold, minSize]);

  const handlePointerUp = useCallback(() => {
    setMode(null);
    setActiveId(null);
    setDragStart(null);
    setSnapGuides({});
  }, []);

  return {
    startDrag,
    startResize,
    handlePointerMove,
    handlePointerUp,
    isDragging: mode !== null,
    dragMode: mode,
    activeId,
    snapGuides,
  };
}
