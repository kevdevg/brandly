/**
 * captionGenerator — Converts word-level Whisper timestamps into TimelineElements.
 * 
 * Groups words into caption phrases (by pause duration or word count).
 * Each group becomes a text element positioned at the bottom of the canvas.
 */

import { TimelineElement } from '../types';

export interface WhisperWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface CaptionStyle {
  position: 'bottom' | 'center' | 'top';
  fontSize: number;
  color: string;
  backgroundColor?: string;
  maxWordsPerGroup: number;
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  position: 'bottom',
  fontSize: 42,
  color: '#ffffff',
  backgroundColor: '#000000AA',
  maxWordsPerGroup: 6,
};

export const CAPTION_PRESETS: { name: string; style: CaptionStyle }[] = [
  {
    name: 'Subtítulo Clásico',
    style: {
      position: 'bottom',
      fontSize: 38,
      color: '#ffffff',
      backgroundColor: '#000000AA',
      maxWordsPerGroup: 6,
    },
  },
  {
    name: 'TikTok',
    style: {
      position: 'center',
      fontSize: 52,
      color: '#ffffff',
      backgroundColor: undefined,
      maxWordsPerGroup: 4,
    },
  },
  {
    name: 'Karaoke',
    style: {
      position: 'bottom',
      fontSize: 44,
      color: '#FFDD00',
      backgroundColor: '#000000CC',
      maxWordsPerGroup: 5,
    },
  },
  {
    name: 'Minimalista',
    style: {
      position: 'bottom',
      fontSize: 32,
      color: '#ffffff',
      backgroundColor: undefined,
      maxWordsPerGroup: 8,
    },
  },
];

/**
 * Group words into caption phrases.
 * Split by:
 * 1. Max words per group
 * 2. Pause > pauseThreshold between words
 */
function groupWords(
  words: WhisperWord[],
  maxWords: number,
  pauseThreshold = 0.5,
): WhisperWord[][] {
  if (words.length === 0) return [];

  const groups: WhisperWord[][] = [];
  let currentGroup: WhisperWord[] = [words[0]];

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    const shouldSplit = currentGroup.length >= maxWords || gap > pauseThreshold;

    if (shouldSplit) {
      groups.push(currentGroup);
      currentGroup = [words[i]];
    } else {
      currentGroup.push(words[i]);
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Generate TimelineElements for auto-captions.
 * 
 * @param words - Word-level timestamps from Whisper
 * @param fps - Frames per second
 * @param audioStartFrame - Frame offset of the audio element
 * @param layerId - Target layer for caption elements
 * @param style - Caption style preset
 */
export function generateCaptionElements(
  words: WhisperWord[],
  fps: number,
  audioStartFrame: number,
  layerId: string,
  style: CaptionStyle = DEFAULT_CAPTION_STYLE,
): TimelineElement[] {
  const groups = groupWords(words, style.maxWordsPerGroup);

  // Y position based on style.position
  const yPosition = style.position === 'top' ? 10 : style.position === 'center' ? 45 : 80;

  return groups.map((group, idx) => {
    const startSec = group[0].start;
    const endSec = group[group.length - 1].end;
    const text = group.map(w => w.word).join(' ');

    // Store word timing info in the content as JSON for potential per-word highlighting
    const startFrame = audioStartFrame + Math.round(startSec * fps);
    const endFrame = audioStartFrame + Math.round(endSec * fps) + Math.round(fps * 0.3); // add 300ms padding

    return {
      id: `caption-${Date.now()}-${idx}`,
      layerId,
      type: 'text' as const,
      content: text,
      startFrame,
      endFrame,
      x: 50,
      y: yPosition,
      fontSize: style.fontSize,
      color: style.color,
      fontWeight: 700,
      textAlign: 'center' as const,
      textBackground: style.backgroundColor,
      textBackgroundPadding: 10,
      textBackgroundRadius: 8,
      lineHeight: 1.3,
      // Mark as auto-caption for potential future filtering
      useBranding: false,
    };
  });
}
