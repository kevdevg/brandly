/**
 * stockMediaApi — Client-side API for searching stock photos/videos.
 * 
 * Proxies through the Express backend to avoid exposing API keys.
 * Supports Pexels API with in-memory result caching.
 */

export interface StockPhoto {
  id: number;
  url: string;       // Full page URL
  thumbUrl: string;   // Small thumbnail
  mediumUrl: string;  // Medium resolution
  fullUrl: string;    // Full resolution
  photographer: string;
  width: number;
  height: number;
  alt: string;
}

export interface StockVideo {
  id: number;
  url: string;
  thumbUrl: string;
  videoUrl: string;   // Direct video file
  photographer: string;
  width: number;
  height: number;
  duration: number;
}

export interface StockSearchResult<T> {
  items: T[];
  totalResults: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// ═══ In-memory cache ═══
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

// ═══ API Functions ═══

export async function searchStockPhotos(
  query: string = '',
  page: number = 1,
  perPage: number = 20
): Promise<StockSearchResult<StockPhoto>> {
  const cacheKey = `photos:${query}:${page}:${perPage}`;
  const cached = getCached<StockSearchResult<StockPhoto>>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      per_page: String(perPage),
    });

    const res = await fetch(`/api/stock/photos?${params}`);
    if (!res.ok) throw new Error(`Stock search failed: ${res.status}`);

    const data = await res.json();
    const result: StockSearchResult<StockPhoto> = {
      items: (data.photos || []).map((p: any) => ({
        id: p.id,
        url: p.url,
        thumbUrl: p.src?.small || p.src?.tiny || '',
        mediumUrl: p.src?.medium || p.src?.large || '',
        fullUrl: p.src?.original || p.src?.large2x || '',
        photographer: p.photographer || 'Unknown',
        width: p.width,
        height: p.height,
        alt: p.alt || '',
      })),
      totalResults: data.total_results || 0,
      page: data.page || page,
      perPage: perPage,
      hasMore: (data.page || page) * perPage < (data.total_results || 0),
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Stock photo search error:', err);
    return { items: [], totalResults: 0, page, perPage, hasMore: false };
  }
}

export async function searchStockVideos(
  query: string = '',
  page: number = 1,
  perPage: number = 15
): Promise<StockSearchResult<StockVideo>> {
  const cacheKey = `videos:${query}:${page}:${perPage}`;
  const cached = getCached<StockSearchResult<StockVideo>>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      per_page: String(perPage),
    });

    const res = await fetch(`/api/stock/videos?${params}`);
    if (!res.ok) throw new Error(`Stock video search failed: ${res.status}`);

    const data = await res.json();
    const result: StockSearchResult<StockVideo> = {
      items: (data.videos || []).map((v: any) => {
        // Pick the best video file (HD preferred)
        const videoFiles = v.video_files || [];
        const hdFile = videoFiles.find((f: any) => f.quality === 'hd') || videoFiles[0] || {};

        return {
          id: v.id,
          url: v.url,
          thumbUrl: v.image || '',
          videoUrl: hdFile.link || '',
          photographer: v.user?.name || 'Unknown',
          width: hdFile.width || v.width || 1920,
          height: hdFile.height || v.height || 1080,
          duration: v.duration || 0,
        };
      }),
      totalResults: data.total_results || 0,
      page: data.page || page,
      perPage: perPage,
      hasMore: (data.page || page) * perPage < (data.total_results || 0),
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Stock video search error:', err);
    return { items: [], totalResults: 0, page, perPage, hasMore: false };
  }
}

// ═══ Download stock image to server (for persistent use) ═══

export async function downloadStockToServer(url: string, filename: string): Promise<string> {
  const res = await fetch('/api/stock/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, filename }),
  });

  if (!res.ok) throw new Error('Download failed');
  const data = await res.json();
  return data.url; // Server-side persistent URL
}
