import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, ChevronDown, Star, Clock, Loader2 } from 'lucide-react';
import {
  FontMeta,
  fetchGoogleFonts,
  searchFonts,
  loadGoogleFont,
  getRecentFonts,
  addRecentFont,
  groupFontsByCategory,
  isFontLoaded,
} from '../../utils/googleFontsApi';

interface FontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  disabled?: boolean;
  brandFont?: string;
}

const VISIBLE_LIMIT = 50;

/**
 * Font picker with search, lazy loading, recent fonts, and category grouping.
 * Uses IntersectionObserver to lazy-load font CSS as items scroll into view.
 */
export const FontPicker: React.FC<FontPickerProps> = ({
  value,
  onChange,
  disabled = false,
  brandFont,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [allFonts, setAllFonts] = useState<FontMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ─── Load font catalog on mount ───
  useEffect(() => {
    fetchGoogleFonts().then(fonts => setAllFonts(fonts));
    setRecentFonts(getRecentFonts());
  }, []);

  // ─── Filtered results ───
  const filtered = useMemo(() => {
    const results = searchFonts(query, allFonts);
    return results.slice(0, VISIBLE_LIMIT);
  }, [query, allFonts]);

  const grouped = useMemo(() => {
    if (query.trim()) return null; // Don't group when searching
    return groupFontsByCategory(filtered);
  }, [filtered, query]);

  // ─── Close on outside click ───
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ─── Focus search on open ───
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // ─── IntersectionObserver to lazy-load fonts ───
  const itemRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const fontFamily = entry.target.getAttribute('data-font');
              if (fontFamily && !isFontLoaded(fontFamily)) {
                loadGoogleFont(fontFamily);
              }
            }
          });
        },
        { root: null, threshold: 0.1 }
      );
    }
    observerRef.current.observe(node);
  }, []);

  // Clean up observer
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleSelect = async (family: string) => {
    setIsLoading(true);
    try {
      await loadGoogleFont(family);
      addRecentFont(family);
      setRecentFonts(getRecentFonts());
      onChange(family);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Load the currently selected font on mount
  useEffect(() => {
    if (value && !isFontLoaded(value)) {
      loadGoogleFont(value);
    }
  }, [value]);

  const renderFontItem = (font: FontMeta | { family: string }, isBrand = false, isRecent = false) => (
    <div
      key={`${isBrand ? 'brand-' : isRecent ? 'recent-' : ''}${font.family}`}
      ref={itemRef}
      data-font={font.family}
      onClick={() => handleSelect(font.family)}
      className={`px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors rounded-md mx-1 ${
        value === font.family
          ? 'bg-violet-600/20 text-violet-300'
          : 'text-neutral-300 hover:bg-neutral-800/80'
      }`}
    >
      {isBrand && <Star size={10} className="text-amber-400 shrink-0" />}
      {isRecent && <Clock size={10} className="text-neutral-500 shrink-0" />}
      <span
        className="text-xs truncate flex-1"
        style={{ fontFamily: `"${font.family}", sans-serif` }}
      >
        {font.family}
      </span>
      {'category' in font && (
        <span className="text-[8px] text-neutral-600 shrink-0 uppercase tracking-wider">
          {font.category?.replace('-', ' ')}
        </span>
      )}
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title="Seleccionar Fuente"
        className={`w-full flex items-center justify-between gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-neutral-700 cursor-pointer'
        } ${isOpen ? 'border-violet-500/50' : ''}`}
      >
        <span
          className="truncate text-neutral-300"
          style={{ fontFamily: `"${value}", sans-serif` }}
        >
          {isLoading ? 'Cargando...' : value || 'Seleccionar fuente'}
        </span>
        <ChevronDown
          size={12}
          className={`text-neutral-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden max-h-[320px] flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-neutral-800 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar fuente..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md pl-7 pr-3 py-1.5 text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Font list */}
          <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
            {/* Brand font */}
            {brandFont && !query && (
              <div className="mb-1">
                <div className="px-3 py-1">
                  <span className="text-[9px] font-semibold text-amber-500/70 uppercase tracking-widest">Marca</span>
                </div>
                {renderFontItem({ family: brandFont }, true)}
              </div>
            )}

            {/* Recent fonts */}
            {recentFonts.length > 0 && !query && (
              <div className="mb-1 border-b border-neutral-800/50 pb-1">
                <div className="px-3 py-1">
                  <span className="text-[9px] font-semibold text-neutral-600 uppercase tracking-widest">Recientes</span>
                </div>
                {recentFonts
                  .filter(f => f !== brandFont)
                  .slice(0, 5)
                  .map(family => renderFontItem({ family }, false, true))}
              </div>
            )}

            {/* Grouped or flat results */}
            {query ? (
              // Flat search results
              filtered.length > 0 ? (
                filtered.map(font => renderFontItem(font))
              ) : (
                <div className="text-center py-4 text-neutral-500 text-xs">
                  Sin resultados para "{query}"
                </div>
              )
            ) : (
              // Grouped by category
              grouped && (Object.entries(grouped) as [string, FontMeta[]][]).map(([category, fonts]) => (
                <div key={category} className="mb-1">
                  <div className="px-3 py-1.5 sticky top-0 bg-neutral-900/95 backdrop-blur-sm">
                    <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-widest">{category}</span>
                  </div>
                  {fonts.map(font => renderFontItem(font))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
