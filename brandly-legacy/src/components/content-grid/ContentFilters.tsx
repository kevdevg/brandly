import React from 'react';
import { ContentStatus, Platform, ContentPillar } from '../../types';
import { STATUS_CONFIG, PLATFORM_CONFIG, ALL_STATUSES, ALL_PLATFORMS } from '../../data/defaults';
import { Filter, X } from 'lucide-react';

interface ContentFiltersProps {
  pillars: ContentPillar[];
  selectedPillar: string | null;
  onPillarChange: (id: string | null) => void;
  selectedStatus: ContentStatus | null;
  onStatusChange: (status: ContentStatus | null) => void;
  selectedPlatform: Platform | null;
  onPlatformChange: (platform: Platform | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Filter bar for the content grid.
 * Allows filtering by pillar, status, platform, and free-text search.
 */
export const ContentFilters: React.FC<ContentFiltersProps> = ({
  pillars,
  selectedPillar,
  onPillarChange,
  selectedStatus,
  onStatusChange,
  selectedPlatform,
  onPlatformChange,
  searchQuery,
  onSearchChange,
}) => {
  const hasFilters = selectedPillar || selectedStatus || selectedPlatform || searchQuery;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar contenido..."
            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
        </div>

        {/* Pillar filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPillarChange(null)}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
              !selectedPillar
                ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
            }`}
            title="Todos los pilares"
          >
            Todos
          </button>
          {pillars.map((p) => (
            <button
              key={p.id}
              onClick={() => onPillarChange(selectedPillar === p.id ? null : p.id)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                selectedPillar === p.id
                  ? 'border-opacity-60 text-white'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
              style={
                selectedPillar === p.id
                  ? { backgroundColor: `${p.color}20`, borderColor: `${p.color}50`, color: p.color }
                  : undefined
              }
              title={`Pilar: ${p.name}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={() => {
              onPillarChange(null);
              onStatusChange(null);
              onPlatformChange(null);
              onSearchChange('');
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-neutral-500 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 transition-all"
            title="Limpiar filtros"
          >
            <X size={10} /> Limpiar
          </button>
        )}
      </div>

      {/* Second row: Status + Platform */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status chips */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wider mr-1">Estado:</span>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = selectedStatus === s;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(isActive ? null : s)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                  isActive
                    ? 'border-opacity-50'
                    : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700'
                }`}
                style={
                  isActive
                    ? { backgroundColor: cfg.bgColor, borderColor: `${cfg.color}50`, color: cfg.color }
                    : undefined
                }
                title={`Filtrar por: ${cfg.label}`}
              >
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Platform chips */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wider mr-1">Red:</span>
          {ALL_PLATFORMS.map((p) => {
            const cfg = PLATFORM_CONFIG[p];
            const isActive = selectedPlatform === p;
            return (
              <button
                key={p}
                onClick={() => onPlatformChange(isActive ? null : p)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                  isActive
                    ? 'border-opacity-50'
                    : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700'
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}50`, color: cfg.color }
                    : undefined
                }
                title={`Filtrar por: ${cfg.label}`}
              >
                <span className="text-[10px]">{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
