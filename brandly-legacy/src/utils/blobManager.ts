/**
 * Track and clean up blob URLs to prevent memory leaks.
 * 
 * Usage:
 *   const url = createTrackedBlobURL(file);
 *   // ... use the url ...
 *   revokeTrackedBlobURL(url); // when done
 */

const trackedURLs = new Set<string>();

/**
 * Create a blob URL and track it for later cleanup.
 */
export function createTrackedBlobURL(source: File | Blob): string {
  const url = URL.createObjectURL(source);
  trackedURLs.add(url);
  return url;
}

/**
 * Revoke a previously tracked blob URL to free memory.
 * Safe to call with non-blob URLs (no-op).
 */
export function revokeTrackedBlobURL(url: string): void {
  if (trackedURLs.has(url)) {
    URL.revokeObjectURL(url);
    trackedURLs.delete(url);
  }
}

/**
 * Revoke all tracked blob URLs. Useful for full cleanup.
 */
export function revokeAllTrackedBlobURLs(): void {
  trackedURLs.forEach(url => URL.revokeObjectURL(url));
  trackedURLs.clear();
}

/**
 * Check if a URL is a blob URL that should be revoked.
 */
export function isBlobURL(url: string): boolean {
  return url.startsWith('blob:');
}
