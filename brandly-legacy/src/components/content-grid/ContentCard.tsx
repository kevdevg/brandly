import React from 'react';
import { ContentPiece, ContentPillar } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PlatformIcons } from './PlatformIcons';
import { GripVertical, Calendar, MessageSquare } from 'lucide-react';

interface ContentCardProps {
  piece: ContentPiece;
  pillar?: ContentPillar;
  onClick: (piece: ContentPiece) => void;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, piece: ContentPiece) => void;
}

/**
 * Card component for a single content piece.
 * Used across Calendar, Grid, and List views.
 * Supports drag-and-drop for reorganization.
 */
export const ContentCard: React.FC<ContentCardProps> = ({
  piece,
  pillar,
  onClick,
  compact = false,
  draggable = false,
  onDragStart,
}) => {
  if (compact) {
    return (
      <button
        onClick={() => onClick(piece)}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, piece)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800/50 transition-all text-left group cursor-pointer"
        title={piece.title}
      >
        {/* Pillar color dot */}
        {pillar && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: pillar.color }}
          />
        )}
        <span className="text-[11px] font-medium text-neutral-300 truncate flex-1">
          {piece.title}
        </span>
        <PlatformIcons platforms={piece.platforms} size="sm" max={2} />
      </button>
    );
  }

  return (
    <div
      onClick={() => onClick(piece)}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, piece)}
      className="group bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-4 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Pillar color bar */}
      {pillar && (
        <div
          className="absolute top-0 left-0 w-full h-0.5"
          style={{ backgroundColor: pillar.color }}
        />
      )}

      {/* Drag handle */}
      {draggable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 cursor-grab">
          <GripVertical size={14} />
        </div>
      )}

      <div className="space-y-2.5">
        {/* Title */}
        <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2 pr-4">
          {piece.title}
        </h4>

        {/* Status + Pillar */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={piece.status} />
          {pillar && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: pillar.color,
                backgroundColor: `${pillar.color}15`,
              }}
            >
              {pillar.name}
            </span>
          )}
        </div>

        {/* Description preview */}
        {piece.description && (
          <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
            {piece.description}
          </p>
        )}

        {/* Footer: platforms + date */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/30">
          <PlatformIcons platforms={piece.platforms} size="sm" />
          <div className="flex items-center gap-2">
            {piece.scheduledDate && (
              <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                <Calendar size={10} />
                {new Date(piece.scheduledDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
            {piece.notes && (
              <MessageSquare size={10} className="text-neutral-600" title="Tiene notas" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
