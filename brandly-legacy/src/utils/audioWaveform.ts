/**
 * Audio waveform extraction utility.
 * Decodes audio files and extracts peak data for visualization.
 */

const peakCache = new Map<string, Float32Array>();
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Decode an audio URL into an AudioBuffer.
 */
export async function decodeAudioUrl(url: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/**
 * Extract peak amplitude data from an AudioBuffer.
 * Returns a Float32Array of normalized peaks (0-1) with `numBuckets` entries.
 */
export function extractPeaks(buffer: AudioBuffer, numBuckets: number): Float32Array {
  const channelData = buffer.getChannelData(0); // Use first channel
  const samplesPerBucket = Math.floor(channelData.length / numBuckets);
  const peaks = new Float32Array(numBuckets);

  for (let i = 0; i < numBuckets; i++) {
    let max = 0;
    const start = i * samplesPerBucket;
    const end = Math.min(start + samplesPerBucket, channelData.length);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  return peaks;
}

/**
 * Get peak data for an audio URL, with caching.
 * @param url - The audio file URL (blob: or http:)
 * @param numBuckets - Number of peak buckets to generate
 */
export async function getPeaks(url: string, numBuckets: number = 200): Promise<Float32Array> {
  const cacheKey = `${url}:${numBuckets}`;
  
  if (peakCache.has(cacheKey)) {
    return peakCache.get(cacheKey)!;
  }

  try {
    const buffer = await decodeAudioUrl(url);
    const peaks = extractPeaks(buffer, numBuckets);
    peakCache.set(cacheKey, peaks);
    return peaks;
  } catch (err) {
    console.warn('[audioWaveform] Failed to decode audio:', err);
    // Return fake peaks as fallback
    const fallback = new Float32Array(numBuckets);
    for (let i = 0; i < numBuckets; i++) {
      fallback[i] = 0.1 + Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.8)) * 0.9;
    }
    return fallback;
  }
}

/**
 * Clear cached peaks for a specific URL or all URLs.
 */
export function clearPeakCache(url?: string): void {
  if (url) {
    // Clear all bucket variants for this URL
    for (const key of peakCache.keys()) {
      if (key.startsWith(url + ':')) {
        peakCache.delete(key);
      }
    }
  } else {
    peakCache.clear();
  }
}
