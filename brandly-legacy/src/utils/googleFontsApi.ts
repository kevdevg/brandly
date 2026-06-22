/**
 * Google Fonts API — Search, load, and cache fonts.
 *
 * Provides:
 * - fetchGoogleFonts(): Fetch & cache the full font catalog (top 200 by popularity)
 * - searchFonts(): Fuzzy search by family name
 * - loadGoogleFont(): Inject CSS link + wait for font to render
 * - getRecentFonts() / addRecentFont(): Recent fonts list (localStorage)
 */

export interface FontMeta {
  family: string;
  category: string;  // sans-serif, serif, display, handwriting, monospace
  variants: string[];
  subsets: string[];
}

// ─── Cache keys ───
const CACHE_KEY = 'remix-google-fonts-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RECENT_KEY = 'remix-recent-fonts';
const MAX_RECENT = 10;

// ─── In-memory state ───
const loadedFonts = new Set<string>();
let cachedFontList: FontMeta[] | null = null;

// ─── Static fallback (top 200 by popularity) ───
const FALLBACK_FONTS: FontMeta[] = [
  // Sans Serif
  { family: 'Inter', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Roboto', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Open Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Montserrat', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Poppins', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Nunito', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Lato', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Raleway', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Work Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Nunito Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Rubik', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Outfit', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Space Grotesk', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'DM Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Figtree', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Manrope', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Ubuntu', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Karla', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Cabin', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Barlow', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Quicksand', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Josefin Sans', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Mulish', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Comfortaa', category: 'sans-serif', variants: ['400', '700'], subsets: ['latin'] },
  // Serif
  { family: 'Playfair Display', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Merriweather', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Lora', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Crimson Text', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'PT Serif', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Bitter', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Source Serif 4', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Libre Baskerville', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'EB Garamond', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Cormorant Garamond', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Spectral', category: 'serif', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'DM Serif Display', category: 'serif', variants: ['400'], subsets: ['latin'] },
  // Display
  { family: 'Bebas Neue', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Oswald', category: 'display', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Anton', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Archivo Black', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Righteous', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Passion One', category: 'display', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Staatliches', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Bungee', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Bangers', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Teko', category: 'display', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Titan One', category: 'display', variants: ['400'], subsets: ['latin'] },
  { family: 'Lilita One', category: 'display', variants: ['400'], subsets: ['latin'] },
  // Handwriting
  { family: 'Dancing Script', category: 'handwriting', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Pacifico', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Caveat', category: 'handwriting', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Satisfy', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Great Vibes', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Sacramento', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Permanent Marker', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Indie Flower', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Kaushan Script', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  { family: 'Yellowtail', category: 'handwriting', variants: ['400'], subsets: ['latin'] },
  // Monospace
  { family: 'JetBrains Mono', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Fira Code', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Source Code Pro', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Roboto Mono', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'Space Mono', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
  { family: 'IBM Plex Mono', category: 'monospace', variants: ['400', '700'], subsets: ['latin'] },
];

/**
 * Fetch Google Fonts catalog. Uses localStorage cache with 24h TTL.
 * Falls back to built-in static list if API call fails or no key is provided.
 */
export async function fetchGoogleFonts(apiKey?: string): Promise<FontMeta[]> {
  if (cachedFontList) return cachedFontList;

  // Check localStorage cache
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.ts && Date.now() - parsed.ts < CACHE_TTL && parsed.fonts?.length > 0) {
        cachedFontList = parsed.fonts;
        return parsed.fonts;
      }
    }
  } catch {}

  // Fetch from API
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
      );
      if (res.ok) {
        const data = await res.json();
        const fonts: FontMeta[] = data.items.slice(0, 200).map((item: any) => ({
          family: item.family,
          category: item.category,
          variants: item.variants,
          subsets: item.subsets,
        }));

        // Persist to localStorage
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), fonts }));
        } catch {}

        cachedFontList = fonts;
        return fonts;
      }
    } catch (err) {
      console.warn('Google Fonts API fetch failed, using fallback:', err);
    }
  }

  // Use fallback
  cachedFontList = FALLBACK_FONTS;
  return FALLBACK_FONTS;
}

/**
 * Search fonts by family name (case-insensitive substring match).
 */
export function searchFonts(query: string, fonts: FontMeta[]): FontMeta[] {
  if (!query.trim()) return fonts;
  const q = query.toLowerCase();
  return fonts.filter(f => f.family.toLowerCase().includes(q));
}

/**
 * Load a Google Font by injecting a <link> into <head>.
 * Waits for the font to become available via document.fonts.
 * Safe to call multiple times — tracks loaded fonts internally.
 */
export async function loadGoogleFont(fontFamily: string): Promise<void> {
  if (loadedFonts.has(fontFamily)) return;

  // Check if already available (system font or previously loaded)
  try {
    const alreadyLoaded = document.fonts.check(`16px "${fontFamily}"`);
    if (alreadyLoaded) {
      loadedFonts.add(fontFamily);
      return;
    }
  } catch {}

  // Inject <link> to Google Fonts CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;

  document.head.appendChild(link);
  loadedFonts.add(fontFamily);

  // Wait for the font to load (with timeout)
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch {}
}

/**
 * Check if a font is already loaded.
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

/**
 * Get recently used fonts from localStorage.
 */
export function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a font to the recent list. Most recent first, max 10.
 */
export function addRecentFont(family: string): void {
  try {
    let recent = getRecentFonts().filter(f => f !== family);
    recent.unshift(family);
    if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

/**
 * Group fonts by category for display.
 */
export function groupFontsByCategory(fonts: FontMeta[]): Record<string, FontMeta[]> {
  const groups: Record<string, FontMeta[]> = {};
  const categoryLabels: Record<string, string> = {
    'sans-serif': 'Sans Serif',
    'serif': 'Serif',
    'display': 'Display',
    'handwriting': 'Handwriting',
    'monospace': 'Monospace',
  };

  for (const font of fonts) {
    const label = categoryLabels[font.category] || font.category;
    if (!groups[label]) groups[label] = [];
    groups[label].push(font);
  }

  return groups;
}
