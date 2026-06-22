/**
 * uploadBlobContent — Resolves blob: URLs in TimelineElement[] to persistent server URLs.
 *
 * Remotion's server-side renderer cannot access browser blob URLs.
 * This utility detects blob: content, uploads each to /api/upload,
 * and returns new elements with persistent /api/media/... URLs.
 */
import type { TimelineElement } from '../types';

/** Check if a URL is a browser-local blob */
function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Convert a blob URL to a File for upload.
 * Fetches the blob, determines a reasonable filename, and wraps it.
 */
async function blobUrlToFile(blobUrl: string, fallbackName: string): Promise<File> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  const ext = blob.type.includes('video') ? '.mp4'
    : blob.type.includes('png') ? '.png'
    : blob.type.includes('webp') ? '.webp'
    : blob.type.includes('gif') ? '.gif'
    : '.jpg';
  return new File([blob], `${fallbackName}${ext}`, { type: blob.type });
}

/**
 * Upload a single File to the server and return an absolute persistent URL.
 * Must be absolute because Remotion's server-side bundler runs on a different
 * port and can't resolve relative paths back to our Express server.
 */
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // Return absolute URL so Remotion's bundler (different port) can reach it
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return `${origin}${data.url}`;
}

/**
 * Cache to avoid re-uploading the same blob URL within a session.
 * Maps blob URL → persistent URL.
 */
const uploadCache = new Map<string, string>();

/**
 * Process an array of TimelineElements, uploading any blob: content URLs
 * to persistent storage and returning new elements with server URLs.
 *
 * Only touches elements whose `content` is a blob: URL and whose type
 * is 'image' or 'video'. All other elements pass through unchanged.
 */
export async function resolveBlobUrls(elements: TimelineElement[]): Promise<TimelineElement[]> {
  const result: TimelineElement[] = [];

  for (const el of elements) {
    if ((el.type === 'image' || el.type === 'video') && el.content && isBlobUrl(el.content)) {
      // Check cache first
      let persistentUrl = uploadCache.get(el.content);
      if (!persistentUrl) {
        try {
          const file = await blobUrlToFile(el.content, `export-${el.id}`);
          persistentUrl = await uploadFile(file);
          uploadCache.set(el.content, persistentUrl);
        } catch (err) {
          console.error(`Failed to upload blob for element ${el.id}:`, err);
          // Keep the blob URL (render will fail gracefully for this element)
          result.push(el);
          continue;
        }
      }
      result.push({ ...el, content: persistentUrl });
    } else {
      result.push(el);
    }
  }

  return result;
}

/**
 * Resolve blob URLs in a fieldData record.
 * Used by batch exporter to upload per-piece media before rendering.
 */
export async function resolveBlobFieldData(
  fieldData: Record<string, string>,
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(fieldData)) {
    if (value && isBlobUrl(value)) {
      let persistentUrl = uploadCache.get(value);
      if (!persistentUrl) {
        try {
          const file = await blobUrlToFile(value, `field-${key}`);
          persistentUrl = await uploadFile(file);
          uploadCache.set(value, persistentUrl);
        } catch (err) {
          console.error(`Failed to upload blob for field ${key}:`, err);
          resolved[key] = value;
          continue;
        }
      }
      resolved[key] = persistentUrl;
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
