/**
 * Utility functions for timeline layer color styling.
 */

export const getLabelClass = (color?: string, isActive?: boolean): string => {
  if (!color) return isActive ? 'bg-neutral-800 border-violet-500 text-white' : 'hover:bg-neutral-900 border-transparent text-neutral-400';
  const colorMap: Record<string, string> = {
    red: 'bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20 text-white',
    orange: 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 text-white',
    yellow: 'bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20 text-white',
    green: 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 text-white',
    blue: 'bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20 text-white',
    purple: 'bg-violet-500/10 border-violet-500/50 hover:bg-violet-500/20 text-white',
    pink: 'bg-pink-500/10 border-pink-500/50 hover:bg-pink-500/20 text-white',
    '#d97706': 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 text-amber-100',
  };
  const activeColorMap: Record<string, string> = {
    red: 'bg-rose-500/20 border-rose-500 text-white',
    orange: 'bg-orange-500/20 border-orange-500 text-white',
    yellow: 'bg-yellow-500/20 border-yellow-500 text-white',
    green: 'bg-emerald-500/20 border-emerald-500 text-white',
    blue: 'bg-blue-500/20 border-blue-500 text-white',
    purple: 'bg-violet-500/20 border-violet-500 text-white',
    pink: 'bg-pink-500/20 border-pink-500 text-white',
    '#d97706': 'bg-amber-500/20 border-amber-500 text-amber-100',
  };
  return isActive ? activeColorMap[color] : colorMap[color];
};

export const getTrackBgClass = (color?: string): string => {
  if (!color) return '';
  const trackMap: Record<string, string> = {
    red: 'bg-rose-500/5',
    orange: 'bg-orange-500/5',
    yellow: 'bg-yellow-500/5',
    green: 'bg-emerald-500/5',
    blue: 'bg-blue-500/5',
    purple: 'bg-violet-500/5',
    pink: 'bg-pink-500/5',
    '#d97706': 'bg-amber-500/5',
  };
  return trackMap[color] || '';
};

export interface DragState {
  id: string;
  type: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  startY: number;
  initialStartFrame: number;
  initialEndFrame: number;
  initialLayerId?: string;
}
