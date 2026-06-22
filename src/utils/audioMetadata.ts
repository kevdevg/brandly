/**
 * Audio metadata utility.
 * Reads real duration from audio files using Web Audio API.
 */

const durationCache = new Map<string, number>();

/**
 * Get the real duration of an audio file in seconds.
 * Results are cached by URL.
 */
export async function getAudioDuration(url: string): Promise<number> {
  if (durationCache.has(url)) {
    return durationCache.get(url)!;
  }

  try {
    const audioCtx = new AudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    durationCache.set(url, duration);
    await audioCtx.close();
    return duration;
  } catch (err) {
    console.warn('[audioMetadata] Failed to get duration:', err);
    return 5; // fallback: 5 seconds
  }
}

/**
 * Convert duration in seconds to frames at a given FPS.
 */
export function durationToFrames(durationSec: number, fps: number = 30): number {
  return Math.round(durationSec * fps);
}

/**
 * Format seconds as mm:ss string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
