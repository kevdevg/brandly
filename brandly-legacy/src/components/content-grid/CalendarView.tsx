import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ContentPiece, ContentPillar } from '../../types';
import { ContentCard } from './ContentCard';

interface CalendarViewProps {
  pieces: ContentPiece[];
  pillars: ContentPillar[];
  onPieceClick: (piece: ContentPiece) => void;
  onCreatePiece: (date: string) => void;
  onDropPiece: (pieceId: string, newDate: string) => void;
}

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Monthly calendar view inspired by Later/Planable.
 * Shows content pieces in day cells with drag-and-drop rescheduling.
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  pieces,
  pillars,
  onPieceClick,
  onCreatePiece,
  onDropPiece,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar grid (6 weeks × 7 days)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Adjust so Monday = 0
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month fill (to complete 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Group pieces by date
  const piecesByDate = useMemo(() => {
    const map: Record<string, ContentPiece[]> = {};
    pieces.forEach(p => {
      if (p.scheduledDate) {
        const key = p.scheduledDate;
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [pieces]);

  const toDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const goToPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('text/piece-id');
    if (pieceId) {
      onDropPiece(pieceId, dateKey);
    }
    setDragOverDate(null);
  }, [onDropPiece]);

  const handleDragStart = useCallback((e: React.DragEvent, piece: ContentPiece) => {
    e.dataTransfer.setData('text/piece-id', piece.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">
            {MONTHS_ES[month]} {year}
          </h3>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-[10px] font-semibold text-violet-400 bg-violet-600/10 border border-violet-500/20 rounded-lg hover:bg-violet-600/20 transition-all"
            title="Ir a hoy"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {DAYS_ES.map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px flex-1 bg-neutral-800/30 rounded-xl overflow-hidden border border-neutral-800/50">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dateKey = toDateKey(date);
          const dayPieces = piecesByDate[dateKey] || [];
          const today = isToday(date);
          const isDragOver = dragOverDate === dateKey;

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-1.5 flex flex-col transition-colors ${
                isCurrentMonth
                  ? 'bg-neutral-950/80'
                  : 'bg-neutral-950/40'
              } ${isDragOver ? 'bg-violet-950/30 ring-1 ring-inset ring-violet-500/40' : ''}`}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, dateKey)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    today
                      ? 'bg-violet-600 text-white'
                      : isCurrentMonth
                        ? 'text-neutral-300'
                        : 'text-neutral-700'
                  }`}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={() => onCreatePiece(dateKey)}
                    className="w-4 h-4 rounded flex items-center justify-center text-neutral-700 hover:text-violet-400 hover:bg-violet-600/10 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
                    title="Crear contenido en este día"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>

              {/* Content pieces */}
              <div className="space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
                {dayPieces.slice(0, 3).map(piece => (
                  <ContentCard
                    key={piece.id}
                    piece={piece}
                    pillar={pillars.find(p => p.id === piece.pillarId)}
                    onClick={onPieceClick}
                    compact
                    draggable
                    onDragStart={handleDragStart}
                  />
                ))}
                {dayPieces.length > 3 && (
                  <span className="text-[9px] text-neutral-600 font-mono px-1">
                    +{dayPieces.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
