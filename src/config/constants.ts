/**
 * Centralized configuration constants for the editor.
 * Avoids hardcoding values across multiple components.
 */

// ═══ Video / Render ═══
export const FPS = 30;
export const DEFAULT_DURATION_FRAMES = 300; // 10 seconds at 30fps
export const MIN_ELEMENT_DURATION_FRAMES = 5;

// ═══ Canvas ═══
export const SNAP_THRESHOLD_PCT = 1.5; // % of canvas for position snap
export const CANVAS_BOUNDS = { min: -20, max: 120 }; // % beyond canvas edges

// ═══ Timeline ═══
export const TIMELINE_SNAP_THRESHOLD_PX = 10;
export const LAYER_ROW_HEIGHT_PX = 40;
export const MAX_HISTORY_STATES = 50;
export const HISTORY_DEBOUNCE_MS = 400;

// ═══ Aspect Ratios ═══
export const ASPECT_DIMENSIONS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
} as const;

// ═══ Safe Area overlays (percentage from edge) ═══
export const SAFE_AREAS = {
  tiktok: { top: 15, bottom: 20, left: 5, right: 5, label: 'TikTok' },
  instagram_reels: { top: 12, bottom: 18, left: 5, right: 5, label: 'Instagram Reels' },
  youtube_shorts: { top: 10, bottom: 15, left: 5, right: 5, label: 'YouTube Shorts' },
} as const;

// ═══ Easing options ═══
export const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'bounce', label: 'Bounce' },
] as const;

// ═══ Position presets (9-point grid) ═══
export const POSITION_PRESETS = [
  { label: '↖', x: 15, y: 15 },
  { label: '↑', x: 50, y: 15 },
  { label: '↗', x: 85, y: 15 },
  { label: '←', x: 15, y: 50 },
  { label: '⬤', x: 50, y: 50 },
  { label: '→', x: 85, y: 50 },
  { label: '↙', x: 15, y: 85 },
  { label: '↓', x: 50, y: 85 },
  { label: '↘', x: 85, y: 85 },
] as const;

// ═══ Export presets ═══
export const EXPORT_PRESETS = [
  { id: 'tiktok', label: 'TikTok', aspect: '9:16' as const, maxDuration: 60 * FPS, codec: 'h264' },
  { id: 'reels', label: 'Instagram Reels', aspect: '9:16' as const, maxDuration: 90 * FPS, codec: 'h264' },
  { id: 'youtube', label: 'YouTube', aspect: '16:9' as const, maxDuration: 0, codec: 'h264' },
  { id: 'shorts', label: 'YouTube Shorts', aspect: '9:16' as const, maxDuration: 60 * FPS, codec: 'h264' },
  { id: 'square', label: 'Instagram Post', aspect: '1:1' as const, maxDuration: 60 * FPS, codec: 'h264' },
  { id: 'portrait', label: 'Instagram Portrait', aspect: '4:5' as const, maxDuration: 60 * FPS, codec: 'h264' },
  { id: 'presentation', label: 'Presentación 4:3', aspect: '4:3' as const, maxDuration: 0, codec: 'h264' },
] as const;
