import React, { useState } from 'react';
import { ContentPillar } from '../../types';
import { Plus, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react';

interface PillarManagerProps {
  pillars: ContentPillar[];
  onChange: (pillars: ContentPillar[]) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48',
];

/**
 * CRUD manager for content pillars.
 * Allows creating, editing, and deleting pillars with color pickers.
 */
export const PillarManager: React.FC<PillarManagerProps> = ({ pillars, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const pillar: ContentPillar = {
      id: `pillar-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
    };
    onChange([...pillars, pillar]);
    setNewName('');
    setNewColor(PRESET_COLORS[(pillars.length + 1) % PRESET_COLORS.length]);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    onChange(pillars.filter(p => p.id !== id));
  };

  const handleStartEdit = (pillar: ContentPillar) => {
    setEditingId(pillar.id);
    setEditName(pillar.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onChange(pillars.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    setEditingId(null);
  };

  const handleColorChange = (id: string, color: string) => {
    onChange(pillars.map(p => p.id === id ? { ...p, color } : p));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          Pilares de Contenido
          <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
            {pillars.length}
          </span>
        </h4>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-violet-400 hover:text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 hover:border-violet-500/40 transition-all"
          title="Agregar pilar"
        >
          <Plus size={12} /> Nuevo Pilar
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-neutral-900/60 border border-violet-500/20 rounded-xl p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nombre del pilar (ej. Educativo)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 transition-all"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 shrink-0">Color:</span>
            <div className="flex gap-1 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    newColor === c ? 'border-white scale-110' : 'border-transparent hover:border-neutral-600'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-[10px] font-medium text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-3 py-1.5 text-[10px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Check size={12} /> Crear
            </button>
          </div>
        </div>
      )}

      {/* Pillar list */}
      <div className="space-y-1.5">
        {pillars.map(pillar => (
          <div
            key={pillar.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900/40 border border-neutral-800/50 hover:border-neutral-700 group transition-all"
          >
            {/* Color dot (editable) */}
            <div className="relative">
              <input
                type="color"
                value={pillar.color}
                onChange={(e) => handleColorChange(pillar.id, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-4 h-4"
                title="Cambiar color"
              />
              <div
                className="w-3 h-3 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white/30 transition-all"
                style={{ backgroundColor: pillar.color }}
              />
            </div>

            {/* Name (editable) */}
            {editingId === pillar.id ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(pillar.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(pillar.id)}
                  title="Guardar"
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  title="Cancelar"
                  className="p-1 text-neutral-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-xs font-medium text-neutral-300">{pillar.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(pillar)}
                    title="Editar pilar"
                    className="p-1 text-neutral-500 hover:text-violet-400 transition-colors"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDelete(pillar.id)}
                    title="Eliminar pilar"
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {pillars.length === 0 && (
          <div className="text-center py-4 text-neutral-600 text-xs">
            No hay pilares definidos. Crea uno para organizar tu contenido.
          </div>
        )}
      </div>
    </div>
  );
};
