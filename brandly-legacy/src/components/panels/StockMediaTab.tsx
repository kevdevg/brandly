import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Film, Image as ImageIcon, Loader2, Download, ExternalLink } from 'lucide-react';
import { searchStockPhotos, searchStockVideos, downloadStockToServer, StockPhoto, StockVideo } from '../../utils/stockMediaApi';
import { useEditor } from '../../context/EditorContext';
import { TimelineElement } from '../../types';

type MediaType = 'photos' | 'videos';

/**
 * StockMediaTab — Search and insert stock photos/videos from Pexels.
 */
export const StockMediaTab: React.FC = () => {
  const {
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    setTimelineElements,
    setSelectedElementId,
    playerRef,
    durationInFrames,
  } = useEditor();

  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('photos');
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [videos, setVideos] = useState<StockVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ─── Search ───
  const doSearch = useCallback(async (q: string, p: number, type: MediaType, append = false) => {
    setIsLoading(true);
    try {
      if (type === 'photos') {
        const result = await searchStockPhotos(q || 'trending', p);
        setPhotos(prev => append ? [...prev, ...result.items] : result.items);
        setHasMore(result.hasMore);
      } else {
        const result = await searchStockVideos(q || 'trending', p);
        setVideos(prev => append ? [...prev, ...result.items] : result.items);
        setHasMore(result.hasMore);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(query, 1, mediaType);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mediaType, doSearch]);

  // Load more (infinite scroll)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !isLoading) {
        const nextPage = page + 1;
        setPage(nextPage);
        doSearch(query, nextPage, mediaType, true);
      }
    }, { threshold: 0.5 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page, query, mediaType, doSearch]);

  // ─── Insert into canvas ───
  const insertPhoto = useCallback(async (photo: StockPhoto) => {
    setIsDownloading(photo.id);
    try {
      // Download to server for persistence
      const persistentUrl = await downloadStockToServer(photo.mediumUrl, `pexels-${photo.id}.jpg`);
      insertElement(persistentUrl, 'image');
    } catch {
      // Fallback: use direct URL
      insertElement(photo.mediumUrl, 'image');
    } finally {
      setIsDownloading(null);
    }
  }, []);

  const insertVideo = useCallback(async (video: StockVideo) => {
    setIsDownloading(video.id);
    try {
      const persistentUrl = await downloadStockToServer(video.videoUrl, `pexels-${video.id}.mp4`);
      insertElement(persistentUrl, 'video');
    } catch {
      insertElement(video.videoUrl, 'video');
    } finally {
      setIsDownloading(null);
    }
  }, []);

  const insertElement = useCallback((src: string, type: 'image' | 'video') => {
    const currentFrame = playerRef.current?.getCurrentFrame() || 0;
    const newId = 'el-' + Date.now();

    let targetLayerId = activeLayerId;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.type === 'brand' || activeLayer.type === 'audio') {
      let visualLayer = layers.find(l => l.type === 'visual' || l.type == null);
      if (!visualLayer) {
        visualLayer = { id: 'layer-' + Date.now(), name: 'Capa Visual', type: 'visual' };
        setLayers(prev => [...prev, visualLayer!]);
      }
      targetLayerId = visualLayer.id;
      setActiveLayerId(targetLayerId);
    }

    const newElement: TimelineElement = {
      id: newId,
      layerId: targetLayerId,
      type,
      content: src,
      startFrame: currentFrame,
      endFrame: Math.min(durationInFrames, currentFrame + (type === 'video' ? 150 : 100)),
      x: 25,
      y: 25,
      width: 50,
    };

    setTimelineElements(prev => [...prev, newElement]);
    setSelectedElementId(newId);
  }, [activeLayerId, layers, playerRef, durationInFrames, setLayers, setActiveLayerId, setTimelineElements, setSelectedElementId]);

  const items = mediaType === 'photos' ? photos : videos;

  return (
    <div className="flex flex-col h-full">
      {/* Search + Type Toggle */}
      <div className="p-3 space-y-2 border-b border-neutral-800/50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en Pexels..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMediaType('photos')}
            title="Buscar fotos"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
              mediaType === 'photos'
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
            }`}
          >
            <ImageIcon size={12} /> Fotos
          </button>
          <button
            onClick={() => setMediaType('videos')}
            title="Buscar videos"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
              mediaType === 'videos'
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
            }`}
          >
            <Film size={12} /> Videos
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {items.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-600 text-xs">
            <Search size={24} className="mb-2 opacity-50" />
            <span>Busca fotos o videos gratis</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {mediaType === 'photos'
            ? photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => insertPhoto(photo)}
                  title={`${photo.alt || 'Foto'} — ${photo.photographer}`}
                  className="relative group rounded-lg overflow-hidden aspect-square bg-neutral-900 border border-neutral-800/50 hover:border-violet-500/40 transition-all"
                  disabled={isDownloading === photo.id}
                >
                  <img
                    src={photo.thumbUrl}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <span className="text-[8px] text-white/80 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      📷 {photo.photographer}
                    </span>
                  </div>
                  {isDownloading === photo.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={20} className="text-violet-400 animate-spin" />
                    </div>
                  )}
                </button>
              ))
            : videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => insertVideo(video)}
                  title={`Video — ${video.photographer} (${video.duration}s)`}
                  className="relative group rounded-lg overflow-hidden aspect-video bg-neutral-900 border border-neutral-800/50 hover:border-violet-500/40 transition-all"
                  disabled={isDownloading === video.id}
                >
                  <img
                    src={video.thumbUrl}
                    alt="Video thumbnail"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Film size={24} className="text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/60 rounded px-1 py-0.5">
                    {video.duration}s
                  </span>
                  {isDownloading === video.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={20} className="text-violet-400 animate-spin" />
                    </div>
                  )}
                </button>
              ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="text-violet-400 animate-spin" />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {/* Pexels attribution */}
        {items.length > 0 && (
          <div className="flex items-center justify-center gap-1 py-3 text-[9px] text-neutral-600">
            <ExternalLink size={8} />
            Fotos proporcionadas por <a href="https://pexels.com" target="_blank" rel="noopener" className="text-neutral-500 underline">Pexels</a>
          </div>
        )}
      </div>
    </div>
  );
};
