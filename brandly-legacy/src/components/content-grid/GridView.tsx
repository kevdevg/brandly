import React, { useMemo, useCallback } from 'react';
import { ContentPiece, ContentPillar, Platform } from '../../types';
import { PlatformIcons } from './PlatformIcons';
import { StatusBadge } from './StatusBadge';
import { Image as ImageIcon, Video, Instagram } from 'lucide-react';

interface GridViewProps {
  pieces: ContentPiece[];
  pillars: ContentPillar[];
  onPieceClick: (piece: ContentPiece) => void;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

/**
 * Visual grid view inspired by Later/Instagram feed planner.
 * Shows content as a 3-column grid preview mimicking how it will look on a social feed.
 */
export const GridView: React.FC<GridViewProps> = ({
  pieces,
  pillars,
  onPieceClick,
  platform,
  onPlatformChange,
}) => {
  // Filter pieces that target the selected platform and are scheduled/published
  const gridPieces = useMemo(() => {
    return pieces
      .filter(p => p.platforms.includes(platform))
      .sort((a, b) => {
        // Sort by scheduled date, most recent first
        const dateA = a.scheduledDate || a.createdAt;
        const dateB = b.scheduledDate || b.createdAt;
        return dateB.localeCompare(dateA);
      });
  }, [pieces, platform]);

  const columns = platform === 'tiktok' || platform === 'youtube' ? 2 : 3;

  return (
    <div className="flex flex-col h-full">
      {/* Platform selector */}
      <div className="flex items-center gap-3 pb-4">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
          Vista de Feed:
        </span>
        <div className="flex gap-1">
          {(['instagram', 'tiktok', 'facebook', 'linkedin'] as Platform[]).map(p => {
            const isActive = platform === p;
            return (
              <button
                key={p}
                onClick={() => onPlatformChange(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                    : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }`}
                title={`Vista de ${p}`}
              >
                {p === 'instagram' && '📸'}
                {p === 'tiktok' && '🎵'}
                {p === 'facebook' && '📘'}
                {p === 'linkedin' && '💼'}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed preview container */}
      <div className="flex-1 flex justify-center overflow-y-auto">
        <div
          className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-4 max-w-lg w-full"
          style={{ maxWidth: columns === 2 ? '380px' : '480px' }}
        >
          {/* Fake profile header */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <div>
              <p className="text-xs font-semibold text-white">@mi_marca</p>
              <p className="text-[10px] text-neutral-500">{gridPieces.length} publicaciones</p>
            </div>
          </div>

          {/* Grid */}
          {gridPieces.length > 0 ? (
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {gridPieces.map(piece => {
                const pillar = pillars.find(p => p.id === piece.pillarId);
                return (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick(piece)}
                    className="relative aspect-square bg-neutral-800 rounded-sm overflow-hidden group hover:opacity-90 transition-all"
                  >
                    {/* Thumbnail or placeholder */}
                    {piece.thumbnailUrl ? (
                      <img
                        src={piece.thumbnailUrl}
                        alt={piece.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center p-2"
                        style={{ backgroundColor: pillar ? `${pillar.color}15` : '#1a1a2e' }}
                      >
                        <div className="text-neutral-600 mb-1">
                          {piece.projectId ? <Video size={16} /> : <ImageIcon size={16} />}
                        </div>
                        <span className="text-[8px] text-neutral-500 text-center line-clamp-2 leading-tight">
                          {piece.title}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      <span className="text-[10px] font-semibold text-white text-center line-clamp-2">
                        {piece.title}
                      </span>
                      <StatusBadge status={piece.status} size="sm" />
                      {piece.scheduledDate && (
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {new Date(piece.scheduledDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Pillar indicator */}
                    {pillar && (
                      <div
                        className="absolute top-1 right-1 w-2 h-2 rounded-full ring-1 ring-black/30"
                        style={{ backgroundColor: pillar.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
              <Instagram size={32} className="mb-3 opacity-30" />
              <p className="text-xs font-medium">No hay contenido para {platform}</p>
              <p className="text-[10px] text-neutral-700 mt-1">
                Crea piezas de contenido y asígnalas a esta plataforma
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
