import React, { useState } from 'react';
import { Settings2, ZoomIn, ZoomOut, Play, BarChart3, Monitor, Square, Smartphone } from 'lucide-react';
import { DesignMD, CompanyProfile } from '../../types';
import { BrandCard } from './BrandCard';
import { PreviewCompanyCard } from './previews/PreviewCompanyCard';
import { PreviewTypography } from './previews/PreviewTypography';
import { PreviewTimeline } from './previews/PreviewTimeline';
import { PreviewRemotion } from './previews/PreviewRemotion';

type BrandTab = 'general' | 'visual' | 'typography' | 'media';
type AspectRatio = '16:9' | '1:1' | '9:16';

interface BrandPreviewProps {
  designMD: DesignMD;
  company: CompanyProfile;
  activeTab: BrandTab;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  handleDesignChange?: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
}

const TAB_SUBTITLES: Record<BrandTab, string> = {
  general: 'Así se presenta tu empresa',
  visual: 'Así luce el sistema de diseño estricto',
  typography: 'Jerarquía tipográfica de tu marca',
  media: 'Preview en vivo del resultado final',
};

const RATIO_ICONS: Record<AspectRatio, React.ReactNode> = {
  '16:9': <Monitor size={13} />,
  '1:1': <Square size={13} />,
  '9:16': <Smartphone size={13} />,
};

const RATIO_LABELS: Record<AspectRatio, string> = {
  '16:9': 'Landscape',
  '1:1': 'Cuadrado',
  '9:16': 'Vertical',
};

export const BrandPreview: React.FC<BrandPreviewProps> = ({
  designMD,
  company,
  activeTab,
  zoom,
  setZoom,
  aspectRatio,
  setAspectRatio,
  handleDesignChange,
}) => {
  const showZoomControls = activeTab === 'visual';
  const showAspectRatio = activeTab === 'visual' || activeTab === 'media';
  const [mediaView, setMediaView] = useState<'player' | 'info'>('player');


  const getDimensions = () => {
    if (aspectRatio === '16:9') return { width: 480, height: 270 };
    if (aspectRatio === '1:1') return { width: 360, height: 360 };
    return { width: 320, height: 480 }; // 9:16
  };
  const dimensions = getDimensions();

  return (
    <div className="w-1/2 bg-neutral-950 p-8 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold mb-1">Previsualización</p>
          <p className="text-sm text-neutral-400">{TAB_SUBTITLES[activeTab]}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Aspect Ratio selector — for visual & media */}
          {showAspectRatio && (
            <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shadow-xl text-sm items-center">
              {(['16:9', '1:1', '9:16'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  title={`${RATIO_LABELS[ratio]} (${ratio})`}
                  className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    aspectRatio === ratio
                      ? 'bg-neutral-800 text-white font-medium shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {RATIO_ICONS[ratio]}
                  <span className="text-xs">{ratio}</span>
                </button>
              ))}
            </div>
          )}

          {/* Zoom controls — visual tab only */}
          {showZoomControls && (
            <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shadow-xl text-sm items-center">
              <button
                onClick={() => setZoom(1)}
                title="Restablecer Vista"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-md transition-colors"
              >
                <Settings2 size={16} />
              </button>
              <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
              <button
                onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}
                title="Zoom Out"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-md transition-colors"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-neutral-400 text-xs w-10 text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                title="Zoom In"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-md transition-colors"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          {/* Media tab: toggle between player and info */}
          {activeTab === 'media' && (
            <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shadow-xl text-sm items-center">
              <button
                onClick={() => setMediaView('player')}
                title="Vista de video en vivo"
                className={`p-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                  mediaView === 'player'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Play size={14} />
                <span className="text-xs">Video</span>
              </button>
              <button
                onClick={() => setMediaView('info')}
                title="Vista de estructura"
                className={`p-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                  mediaView === 'info'
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <BarChart3 size={14} />
                <span className="text-xs">Estructura</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Content — full remaining space */}
      <div className="flex-1 flex items-center justify-center overflow-auto min-h-0">
        {activeTab === 'general' && (
          <PreviewCompanyCard company={company} designMD={designMD} />
        )}

        {activeTab === 'visual' && (
          <BrandCard
            designMD={designMD}
            width={dimensions.width}
            height={dimensions.height}
            scale={zoom}
          />
        )}

        {activeTab === 'typography' && (
          <div className="flex items-center gap-6 max-h-full overflow-auto">
            <PreviewTypography designMD={designMD} />
          </div>
        )}

        {activeTab === 'media' && mediaView === 'player' && (
          <div className="flex flex-col h-full w-full min-h-0">
            <div className="flex-1 min-h-0">
              <PreviewRemotion 
                designMD={designMD} 
                company={company} 
                aspectRatio={aspectRatio}
                onDesignChange={handleDesignChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'media' && mediaView === 'info' && (
          <div className="overflow-auto max-h-full w-full max-w-md mx-auto">
            <PreviewTimeline designMD={designMD} aspectRatio={aspectRatio} />
          </div>
        )}


      </div>
    </div>
  );
};
