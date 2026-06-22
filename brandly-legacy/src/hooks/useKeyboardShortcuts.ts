import { useEffect, useRef, RefObject } from 'react';
import { PlayerRef } from '@remotion/player';
import { TimelineElement } from '../types';

interface UseKeyboardShortcutsOptions {
  enabled: boolean;
  playerRef: RefObject<PlayerRef | null>;
  durationInFrames: number;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  timelineElements: TimelineElement[];
  setTimelineElements: React.Dispatch<React.SetStateAction<TimelineElement[]>>;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  enabled,
  playerRef,
  durationInFrames,
  selectedElementId,
  setSelectedElementId,
  timelineElements,
  setTimelineElements,
  undo,
  redo,
}: UseKeyboardShortcutsOptions): void {
  // Clipboard for copy/paste (persists across renders via ref)
  const clipboardRef = useRef<TimelineElement | null>(null);
  // Style clipboard for copy/paste style
  const styleClipboardRef = useRef<Partial<TimelineElement> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const player = playerRef.current;
      const isMeta = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        if (player) {
          if (player.isPlaying()) player.pause();
          else player.play();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (player) {
          player.seekTo(Math.max(0, player.getCurrentFrame() - 1));
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (player) {
          player.seekTo(Math.min(durationInFrames - 1, player.getCurrentFrame() + 1));
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          const element = timelineElements.find(el => el.id === selectedElementId);
          if (element?.isBrandElement) return;
          e.preventDefault();
          setTimelineElements(prev => prev.filter(el => el.id !== selectedElementId));
          setSelectedElementId(null);
        }
      } else if (isMeta && e.key.toLowerCase() === 'c') {
        // ═══ Copy ═══
        if (selectedElementId) {
          const element = timelineElements.find(el => el.id === selectedElementId);
          if (element && !element.isBrandElement) {
            e.preventDefault();
            clipboardRef.current = { ...element };
          }
        }
      } else if (isMeta && e.key.toLowerCase() === 'v') {
        // ═══ Paste ═══
        if (clipboardRef.current) {
          e.preventDefault();
          const src = clipboardRef.current;
          const currentFrame = player?.getCurrentFrame() ?? 0;
          const duration = src.endFrame - src.startFrame;
          const newEl: TimelineElement = {
            ...src,
            id: 'el-' + Date.now(),
            // Paste at current playhead position (shift+V keeps original timing)
            startFrame: e.shiftKey ? src.startFrame : currentFrame,
            endFrame: e.shiftKey ? src.endFrame : currentFrame + duration,
            x: src.x + 3,
            y: src.y + 3,
            isBrandElement: false,
            isLocked: false,
          };
          setTimelineElements(prev => [...prev, newEl]);
          setSelectedElementId(newEl.id);
        }
      } else if (isMeta && e.key.toLowerCase() === 'd') {
        // ═══ Duplicate (Cmd+D) ═══
        if (selectedElementId) {
          const element = timelineElements.find(el => el.id === selectedElementId);
          if (element && !element.isBrandElement) {
            e.preventDefault();
            const copy: TimelineElement = {
              ...element,
              id: 'el-' + Date.now(),
              x: element.x + 3,
              y: element.y + 3,
              isBrandElement: false,
              isLocked: false,
            };
            setTimelineElements(prev => {
              const idx = prev.findIndex(el => el.id === selectedElementId);
              const next = [...prev];
              next.splice(idx + 1, 0, copy);
              return next;
            });
            setSelectedElementId(copy.id);
          }
        }
      } else if (e.key.toLowerCase() === 's' && !isMeta && selectedElementId) {
        // ═══ Split clip at playhead ═══
        const element = timelineElements.find(el => el.id === selectedElementId);
        if (element && !element.isBrandElement && player) {
          const splitFrame = player.getCurrentFrame();
          // Only split if playhead is within the element's range (with margin)
          if (splitFrame > element.startFrame + 2 && splitFrame < element.endFrame - 2) {
            e.preventDefault();
            const secondHalf: TimelineElement = {
              ...element,
              id: 'el-' + Date.now(),
              startFrame: splitFrame,
              isBrandElement: false,
            };
            setTimelineElements(prev => {
              const idx = prev.findIndex(el => el.id === element.id);
              const updated = [...prev];
              // Trim the first half
              updated[idx] = { ...element, endFrame: splitFrame };
              // Insert second half after
              updated.splice(idx + 1, 0, secondHalf);
              return updated;
            });
            setSelectedElementId(secondHalf.id);
          }
        }
      } else if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (isMeta && e.altKey && e.key.toLowerCase() === 'c') {
        // ═══ Copy Style (Cmd+Alt+C) ═══
        if (selectedElementId) {
          const element = timelineElements.find(el => el.id === selectedElementId);
          if (element) {
            e.preventDefault();
            styleClipboardRef.current = {
              scale: element.scale,
              rotation: element.rotation,
              opacity: element.opacity,
              brightness: element.brightness,
              contrast: element.contrast,
              saturation: element.saturation,
              blendMode: element.blendMode,
              chromaKeyEnabled: element.chromaKeyEnabled,
              chromaKeyColor: element.chromaKeyColor,
              chromaKeyTolerance: element.chromaKeyTolerance,
              chromaKeySoftness: element.chromaKeySoftness,
              shadowColor: element.shadowColor,
              shadowOffset: element.shadowOffset,
              shadowBlur: element.shadowBlur,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              fontSize: element.fontSize,
              color: element.color,
              textAlign: element.textAlign,
              textStrokeWidth: element.textStrokeWidth,
              textStrokeColor: element.textStrokeColor,
              lineHeight: element.lineHeight,
              letterSpacing: element.letterSpacing,
            };
          }
        }
      } else if (isMeta && e.altKey && e.key.toLowerCase() === 'v') {
        // ═══ Paste Style (Cmd+Alt+V) ═══
        if (selectedElementId && styleClipboardRef.current) {
          e.preventDefault();
          const style = styleClipboardRef.current;
          setTimelineElements(prev => prev.map(el => {
            if (el.id !== selectedElementId) return el;
            // Only apply non-undefined style properties
            const updated = { ...el };
            for (const [key, val] of Object.entries(style)) {
              if (val !== undefined) {
                (updated as any)[key] = val;
              }
            }
            return updated;
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, durationInFrames, selectedElementId, setSelectedElementId, timelineElements, setTimelineElements, undo, redo, playerRef]);
}
