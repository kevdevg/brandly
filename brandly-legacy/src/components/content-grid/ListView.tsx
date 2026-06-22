import React, { useMemo, useCallback, useState } from 'react';
import { ContentPiece, ContentPillar, ContentStatus } from '../../types';
import { ContentCard } from './ContentCard';
import { STATUS_CONFIG, ALL_STATUSES } from '../../data/defaults';
import { Columns3, List as ListIcon } from 'lucide-react';

interface ListViewProps {
  pieces: ContentPiece[];
  pillars: ContentPillar[];
  onPieceClick: (piece: ContentPiece) => void;
  onStatusChange: (pieceId: string, newStatus: ContentStatus) => void;
}

type ListMode = 'kanban' | 'list';

/**
 * List/Kanban view for content pieces.
 * Kanban: columns per status with drag-and-drop between columns.
 * List: simple scrollable list grouped by status.
 */
export const ListView: React.FC<ListViewProps> = ({
  pieces,
  pillars,
  onPieceClick,
  onStatusChange,
}) => {
  const [mode, setMode] = useState<ListMode>('kanban');
  const [dragOverStatus, setDragOverStatus] = useState<ContentStatus | null>(null);

  // Group pieces by status
  const groupedPieces = useMemo(() => {
    const map: Record<ContentStatus, ContentPiece[]> = {
      'idea': [],
      'draft': [],
      'in-review': [],
      'approved': [],
      'scheduled': [],
      'published': [],
    };
    pieces.forEach(p => {
      map[p.status].push(p);
    });
    return map;
  }, [pieces]);

  const handleDragStart = useCallback((e: React.DragEvent, piece: ContentPiece) => {
    e.dataTransfer.setData('text/piece-id', piece.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: ContentStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: ContentStatus) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('text/piece-id');
    if (pieceId) {
      onStatusChange(pieceId, status);
    }
    setDragOverStatus(null);
  }, [onStatusChange]);

  if (mode === 'list') {
    return (
      <div className="flex flex-col h-full">
        {/* Mode toggle */}
        <div className="flex items-center justify-end pb-3">
          <ModeToggle mode={mode} setMode={setMode} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
          {ALL_STATUSES.map(status => {
            const statusPieces = groupedPieces[status];
            if (statusPieces.length === 0) return null;
            const cfg = STATUS_CONFIG[status];

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label}
                  </h4>
                  <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
                    {statusPieces.length}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {statusPieces.map(piece => (
                    <ContentCard
                      key={piece.id}
                      piece={piece}
                      pillar={pillars.find(p => p.id === piece.pillarId)}
                      onClick={onPieceClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Kanban mode
  return (
    <div className="flex flex-col h-full">
      {/* Mode toggle */}
      <div className="flex items-center justify-end pb-3">
        <ModeToggle mode={mode} setMode={setMode} />
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {ALL_STATUSES.map(status => {
          const cfg = STATUS_CONFIG[status];
          const statusPieces = groupedPieces[status];
          const isDragOver = dragOverStatus === status;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-[260px] flex flex-col rounded-xl border transition-colors ${
                isDragOver
                  ? 'border-violet-500/40 bg-violet-950/20'
                  : 'border-neutral-800/50 bg-neutral-900/30'
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800/30">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <span className="ml-auto text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
                  {statusPieces.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar min-h-[120px]">
                {statusPieces.map(piece => (
                  <ContentCard
                    key={piece.id}
                    piece={piece}
                    pillar={pillars.find(p => p.id === piece.pillarId)}
                    onClick={onPieceClick}
                    draggable
                    onDragStart={handleDragStart}
                  />
                ))}

                {statusPieces.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-neutral-700 text-[10px] font-medium border border-dashed border-neutral-800 rounded-lg">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Toggle between kanban and list modes */
const ModeToggle: React.FC<{ mode: ListMode; setMode: (m: ListMode) => void }> = ({ mode, setMode }) => (
  <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
    <button
      onClick={() => setMode('kanban')}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
        mode === 'kanban'
          ? 'bg-neutral-800 text-white shadow-sm'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
      title="Vista Kanban"
    >
      <Columns3 size={12} /> Kanban
    </button>
    <button
      onClick={() => setMode('list')}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
        mode === 'list'
          ? 'bg-neutral-800 text-white shadow-sm'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
      title="Vista Lista"
    >
      <ListIcon size={12} /> Lista
    </button>
  </div>
);
