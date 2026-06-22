import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, LayoutGrid, List, Plus, Settings2, Sparkles,
  BarChart3, TrendingUp
} from 'lucide-react';
import {
  ContentPiece, ContentPillar, ContentStatus, Platform, CompanyProfile
} from '../../types';
import { DEFAULT_PILLARS } from '../../data/defaults';
import { ContentFilters } from './ContentFilters';
import { CalendarView } from './CalendarView';
import { GridView } from './GridView';
import { ListView } from './ListView';
import { ContentDetailModal } from './ContentDetailModal';
import { PillarManager } from './PillarManager';

type ViewMode = 'calendar' | 'grid' | 'list';

interface ContentGridViewProps {
  company: CompanyProfile;
  pieces: ContentPiece[];
  pillars: ContentPillar[];
  onPiecesChange: (pieces: ContentPiece[]) => void;
  onPillarsChange: (pillars: ContentPillar[]) => void;
  onOpenProject: (projectId: string) => void;
}

/**
 * Main content grid view with three visualization modes.
 * Orchestrates Calendar, Grid, and List views with shared filters.
 */
export const ContentGridView: React.FC<ContentGridViewProps> = ({
  company,
  pieces,
  pillars,
  onPiecesChange,
  onPillarsChange,
  onOpenProject,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showSettings, setShowSettings] = useState(false);
  const [editingPiece, setEditingPiece] = useState<ContentPiece | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();

  // Grid view state
  const [gridPlatform, setGridPlatform] = useState<Platform>('instagram');

  // Filters
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pieces
  const filteredPieces = useMemo(() => {
    return pieces.filter(p => {
      if (selectedPillar && p.pillarId !== selectedPillar) return false;
      if (selectedStatus && p.status !== selectedStatus) return false;
      if (selectedPlatform && !p.platforms.includes(selectedPlatform)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.caption || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [pieces, selectedPillar, selectedStatus, selectedPlatform, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = pieces.length;
    const scheduled = pieces.filter(p => p.status === 'scheduled').length;
    const published = pieces.filter(p => p.status === 'published').length;
    const thisWeek = pieces.filter(p => {
      if (!p.scheduledDate) return false;
      const d = new Date(p.scheduledDate);
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= now && d <= weekEnd;
    }).length;
    return { total, scheduled, published, thisWeek };
  }, [pieces]);

  // Handlers
  const handleCreatePiece = useCallback((date?: string) => {
    setCreateDate(date);
    setEditingPiece(null);
    setShowCreateModal(true);
  }, []);

  const handleSavePiece = useCallback((piece: ContentPiece) => {
    piece.companyId = company.id;
    const exists = pieces.find(p => p.id === piece.id);
    if (exists) {
      onPiecesChange(pieces.map(p => p.id === piece.id ? piece : p));
    } else {
      // Apply the pre-set date if creating from calendar
      if (createDate && !piece.scheduledDate) {
        piece.scheduledDate = createDate;
        if (piece.status === 'idea') piece.status = 'draft';
      }
      onPiecesChange([...pieces, piece]);
    }
    setEditingPiece(null);
    setShowCreateModal(false);
    setCreateDate(undefined);
  }, [pieces, company.id, onPiecesChange, createDate]);

  const handleDeletePiece = useCallback((id: string) => {
    onPiecesChange(pieces.filter(p => p.id !== id));
    setEditingPiece(null);
    setShowCreateModal(false);
  }, [pieces, onPiecesChange]);

  const handleDropPiece = useCallback((pieceId: string, newDate: string) => {
    onPiecesChange(pieces.map(p =>
      p.id === pieceId
        ? { ...p, scheduledDate: newDate, updatedAt: new Date().toISOString() }
        : p
    ));
  }, [pieces, onPiecesChange]);

  const handleStatusChange = useCallback((pieceId: string, newStatus: ContentStatus) => {
    onPiecesChange(pieces.map(p =>
      p.id === pieceId
        ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
        : p
    ));
  }, [pieces, onPiecesChange]);

  const handlePieceClick = useCallback((piece: ContentPiece) => {
    setEditingPiece(piece);
    setShowCreateModal(true);
  }, []);

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full relative bg-neutral-950">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden p-6">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Malla de Contenidos</h1>
              <p className="text-[11px] text-neutral-500">
                {company.name} · {filteredPieces.length} de {pieces.length} piezas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats mini-bar */}
            <div className="hidden md:flex items-center gap-3 mr-3">
              <StatPill label="Esta semana" value={stats.thisWeek} icon={<TrendingUp size={10} />} color="#a78bfa" />
              <StatPill label="Programados" value={stats.scheduled} icon={<CalendarDays size={10} />} color="#60a5fa" />
              <StatPill label="Publicados" value={stats.published} icon={<BarChart3 size={10} />} color="#22c55e" />
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all border ${
                showSettings
                  ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
              }`}
              title="Configurar Pilares"
            >
              <Settings2 size={16} />
            </button>

            {/* New content CTA */}
            <button
              onClick={() => handleCreatePiece()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} /> Nuevo Contenido
            </button>
          </div>
        </div>

        {/* ═══ Settings Panel (Pillar Manager) ═══ */}
        {showSettings && (
          <div className="mb-5 bg-neutral-900/40 border border-neutral-800/50 rounded-xl p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <PillarManager pillars={pillars} onChange={onPillarsChange} />
          </div>
        )}

        {/* ═══ View Mode Toggle + Filters ═══ */}
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Filters */}
          <div className="flex-1 min-w-0">
            <ContentFilters
              pillars={pillars}
              selectedPillar={selectedPillar}
              onPillarChange={setSelectedPillar}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 shrink-0">
            {([
              { id: 'calendar' as ViewMode, icon: <CalendarDays size={14} />, label: 'Calendario' },
              { id: 'grid' as ViewMode, icon: <LayoutGrid size={14} />, label: 'Grid' },
              { id: 'list' as ViewMode, icon: <List size={14} />, label: 'Lista' },
            ]).map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === v.id
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title={v.label}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ View Content ═══ */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'calendar' && (
            <CalendarView
              pieces={filteredPieces}
              pillars={pillars}
              onPieceClick={handlePieceClick}
              onCreatePiece={(date) => handleCreatePiece(date)}
              onDropPiece={handleDropPiece}
            />
          )}
          {viewMode === 'grid' && (
            <GridView
              pieces={filteredPieces}
              pillars={pillars}
              onPieceClick={handlePieceClick}
              platform={gridPlatform}
              onPlatformChange={setGridPlatform}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              pieces={filteredPieces}
              pillars={pillars}
              onPieceClick={handlePieceClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Empty state */}
          {filteredPieces.length === 0 && pieces.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-violet-500/40" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-1">Tu malla está vacía</h3>
              <p className="text-xs text-neutral-600 text-center max-w-xs mb-4">
                Empieza a planificar tu contenido creando piezas y organizándolas en el calendario
              </p>
              <button
                onClick={() => handleCreatePiece()}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 text-xs font-semibold rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-all"
              >
                <Plus size={14} /> Crear primera pieza
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Content Detail Modal ═══ */}
      {showCreateModal && (
        <ContentDetailModal
          piece={editingPiece}
          pillars={pillars}
          projects={company.projects || []}
          onSave={handleSavePiece}
          onDelete={handleDeletePiece}
          onClose={() => { setShowCreateModal(false); setEditingPiece(null); setCreateDate(undefined); }}
          onOpenProject={onOpenProject}
        />
      )}
    </div>
  );
};

/** Mini stat pill for the header */
const StatPill: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color,
}) => (
  <div
    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium"
    style={{ borderColor: `${color}20`, color, backgroundColor: `${color}08` }}
  >
    {icon}
    <span className="font-bold">{value}</span>
    <span className="opacity-60">{label}</span>
  </div>
);
