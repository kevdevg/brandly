import React, { useState, useCallback } from 'react';
import { DesignMD, BrandContentPiece } from '../types';
import { X, Search, Image as ImageIcon, Video, Film, Loader2 } from 'lucide-react';
import { uploadMedia } from '../utils/mediaUploader';
import { FileDropZone } from './ui/FileDropZone';
import { StockMediaTab } from './panels/StockMediaTab';

const mockImages: string[] = [];
const mockVideos: string[] = [];

interface MediaLibraryPanelProps {
  onClose: () => void;
  designMD: DesignMD;
  brandContent?: BrandContentPiece[];
}

type MediaTab = 'images' | 'video' | 'stock';
type LocalFile = { type: MediaTab; src: string };

export const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({ onClose, designMD, brandContent = [] }) => {
  const [tab, setTab] = useState<MediaTab>('images');
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);

    try {
      const newFiles: LocalFile[] = [];

      for (const file of files) {
        let type: MediaTab = 'images';
        if (file.type.startsWith('video/')) type = 'video';

        const result = await uploadMedia(file);
        newFiles.push({ type, src: result.url });
      }

      setLocalFiles(prev => [...newFiles, ...prev]);
      if (newFiles.length > 0) {
        setTab(newFiles[0].type);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const currentItems = tab === 'images' ? mockImages : mockVideos;
  const filteredLocalFiles = localFiles.filter(f => f.type === tab).map(f => f.src);
  const displayItems = [...filteredLocalFiles, ...currentItems];

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800/60 flex flex-col h-full z-10 shrink-0 shadow-lg animate-in slide-in-from-left-2 duration-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Film size={14} className="text-sky-400" />
          Media
        </h3>
        <button onClick={onClose} title="Cerrar Panel" className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors">
          <X size={16} />
        </button>
      </div>
      
      {/* Tabs: Fotos | Video */}
      <div className="flex border-b border-neutral-800">
        <button 
          onClick={() => setTab('images')}
          title="Ver Imágenes"
          className={`flex-1 p-2.5 text-xs font-medium flex justify-center items-center gap-1.5 ${tab === 'images' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          <ImageIcon size={14} /> Fotos
        </button>
        <button 
          onClick={() => setTab('video')}
          title="Ver Videos"
          className={`flex-1 p-2.5 text-xs font-medium flex justify-center items-center gap-1.5 ${tab === 'video' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          <Video size={14} /> Video
        </button>
        <button 
          onClick={() => setTab('stock')}
          title="Buscar en Pexels"
          className={`flex-1 p-2.5 text-xs font-medium flex justify-center items-center gap-1.5 ${tab === 'stock' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          <Search size={14} /> Stock
        </button>
      </div>

      {/* Stock Media Tab */}
      {tab === 'stock' ? (
        <StockMediaTab />
      ) : (
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder={`Buscar ${tab === 'images' ? 'fotos' : 'videos'}...`}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Upload */}
        <FileDropZone
          accept={tab === 'images' ? 'image/*' : 'video/*'}
          multiple
          onFiles={handleFileUpload}
          label={isUploading ? 'Subiendo...' : `Subir ${tab === 'images' ? 'imágenes' : 'videos'}`}
          sublabel={isUploading ? undefined : "o arrastra archivos aquí"}
        />
        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-2 text-violet-400">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[10px] font-medium">Subiendo al servidor...</span>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2">
          {displayItems.map((src, i) => (
            <div 
              key={`${tab}-${i}`} 
              className="aspect-square bg-neutral-800 rounded-lg overflow-hidden group relative cursor-grab active:cursor-grabbing flex items-center justify-center p-1"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', src);
                e.dataTransfer.setData('application/json', JSON.stringify({ type: tab, src }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              {tab === 'images' ? (
                <img src={src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded" alt="Media" draggable={false} />
              ) : (
                <video src={src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded" />
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-lg">
                <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">Arrastrar</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {displayItems.length === 0 && (
          <div className="text-center py-6 text-neutral-500">
            {tab === 'images' ? <ImageIcon size={28} className="mx-auto mb-2 opacity-40" /> : <Video size={28} className="mx-auto mb-2 opacity-40" />}
            <p className="text-xs font-medium">Sin {tab === 'images' ? 'imágenes' : 'videos'}</p>
            <p className="text-[10px] mt-1">Sube archivos para empezar</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
