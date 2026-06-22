/**
 * Media Uploader — Persistent file storage via server API.
 *
 * Replaces blob URLs with persistent server URLs that survive page reloads.
 * Uploads files to the Express backend which stores them on the filesystem.
 *
 * Usage:
 *   const { url, originalName } = await uploadMedia(file);
 *   // url is now a persistent path like "/api/media/abc123.png"
 *
 * Includes a hash-based dedup cache to avoid re-uploading the same file.
 */

export interface UploadResult {
  url: string;
  originalName: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

// Cache: file hash → server URL (avoids re-uploading identical files)
const uploadCache = new Map<string, string>();

/**
 * Compute a fast hash of a File using its name + size + lastModified.
 * Not cryptographic, but sufficient for dedup within a session.
 */
function fileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Upload a file to the server and return a persistent URL.
 *
 * @param file - The file to upload
 * @param onProgress - Optional progress callback (uses XHR for progress events)
 * @returns Persistent URL and original filename
 */
export async function uploadMedia(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Check dedup cache
  const fingerprint = fileFingerprint(file);
  const cached = uploadCache.get(fingerprint);
  if (cached) {
    onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
    return { url: cached, originalName: file.name };
  }

  const formData = new FormData();
  formData.append('file', file);

  if (onProgress) {
    // Use XMLHttpRequest for progress tracking
    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            uploadCache.set(fingerprint, data.url);
            resolve({ url: data.url, originalName: data.originalName });
          } catch {
            reject(new Error('Invalid server response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }

  // Simple fetch path (no progress needed)
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed: ${response.status} — ${err}`);
  }

  const data = await response.json();
  uploadCache.set(fingerprint, data.url);
  return { url: data.url, originalName: data.originalName };
}

/**
 * Check if a URL is a persistent server URL (not a blob).
 */
export function isServerURL(url: string): boolean {
  return url.startsWith('/api/media/');
}

/**
 * Migrate a blob URL to a persistent URL by uploading the blob.
 * Returns the original URL if it's already persistent.
 */
export async function ensurePersistentURL(url: string): Promise<string> {
  if (isServerURL(url) || !url.startsWith('blob:')) {
    return url;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], 'migrated-media', { type: blob.type });
    const result = await uploadMedia(file);
    return result.url;
  } catch (err) {
    console.warn('Failed to migrate blob URL to persistent storage:', err);
    return url; // Graceful fallback — keep the blob URL
  }
}
