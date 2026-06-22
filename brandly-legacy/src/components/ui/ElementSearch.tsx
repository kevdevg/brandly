import React, { useState, useMemo } from 'react';
import { Search, X, Type, Image, Video, Music, Square, Palette } from 'lucide-react';
import { TimelineElement } from '../../types';

interface ElementSearchProps {
  timelineElements: TimelineElement[];
  onSelectElement: (id: string) => void;
  selectedElementId: string | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type size={10} className="text-violet-400" />,
  image: <Image size={10} className="text-sky-400" />,
  video: <Video size={10} className="text-rose-400" />,
  audio: <Music size={10} className="text-amber-400" />,
  shape: <Square size={10} className="text-emerald-400" />,
  sticker: <span className="text-[10px]">🎨</span>,
  color: <Palette size={10} className="text-neutral-400" />,
};

/**
 * ElementSearch — Quick search and filter for timeline elements.
 * Allows filtering by name, content, or type.
 */
export const ElementSearch: React.FC<ElementSearchProps> = ({
  timelineElements,
  onSelectElement,
  selectedElementId,
}) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return timelineElements
      .filter(el => !el.isBrandElement)
      .filter(el => {
        if (typeFilter && el.type !== typeFilter) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        const name = (el.elementName ?? '').toLowerCase();
        const content = (el.content ?? '').toLowerCase();
        const type = el.type.toLowerCase();
        return name.includes(q) || content.includes(q) || type.includes(q);
      });
  }, [timelineElements, query, typeFilter]);

  const types = useMemo(() => {
    const t = new Set(timelineElements.filter(e => !e.isBrandElement).map(e => e.type));
    return Array.from(t);
  }, [timelineElements]);

  return (
    <div className="space-y-1.5">
      {/* Search input */}
      <div className="relative">
        <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-600" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar elementos..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-md text-[9px] text-neutral-300 pl-6 pr-6 py-1 outline-none focus:border-violet-500/40 placeholder-neutral-600"
          title="Buscar por nombre, contenido o tipo"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            title="Limpiar búsqueda"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 p-0.5"
          >
            <X size={8} />
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex gap-0.5 flex-wrap">
        <button
          onClick={() => setTypeFilter(null)}
          title="Mostrar todos"
          className={`px-1.5 py-0.5 rounded text-[7px] transition-colors border ${
            !typeFilter
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
          }`}
        >
          Todos
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            title={`Filtrar: ${type}`}
            className={`px-1.5 py-0.5 rounded text-[7px] transition-colors border flex items-center gap-0.5 ${
              typeFilter === type
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400'
            }`}
          >
            {TYPE_ICONS[type]}
            {type}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-[8px] text-neutral-600 text-center py-2">Sin resultados</div>
        )}
        {filtered.map(el => (
          <button
            key={el.id}
            onClick={() => onSelectElement(el.id)}
            title={el.elementName || el.content?.slice(0, 40) || el.type}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-all ${
              selectedElementId === el.id
                ? 'bg-violet-500/15 border border-violet-500/30'
                : 'hover:bg-neutral-800/50 border border-transparent'
            }`}
          >
            {TYPE_ICONS[el.type] || <span className="w-2.5" />}
            <span className="text-[8px] text-neutral-300 truncate flex-1">
              {el.elementName || el.content?.slice(0, 30) || el.type}
            </span>
            <span className="text-[7px] text-neutral-600 font-mono flex-shrink-0">
              {((el.endFrame - el.startFrame) / 30).toFixed(1)}s
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
