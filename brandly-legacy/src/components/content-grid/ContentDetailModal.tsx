import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, ExternalLink, Calendar, Clock, Hash, FileText, StickyNote } from 'lucide-react';
import { ContentPiece, ContentPillar, ContentStatus, Platform, Project } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PlatformSelector } from './PlatformIcons';
import { ALL_STATUSES, STATUS_CONFIG } from '../../data/defaults';

interface ContentDetailModalProps {
  piece: ContentPiece | null;
  pillars: ContentPillar[];
  projects: Project[];
  onSave: (piece: ContentPiece) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onOpenProject?: (projectId: string) => void;
}

/**
 * Modal for creating/editing a content piece.
 * Contains all fields: title, description, status, pillar, platforms,
 * scheduled date/time, caption, hashtags, and notes.
 */
export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  piece,
  pillars,
  projects,
  onSave,
  onDelete,
  onClose,
  onOpenProject,
}) => {
  const isNew = !piece;
  const [form, setForm] = useState<ContentPiece>(() => {
    if (piece) return { ...piece };
    return {
      id: `content-${Date.now()}`,
      companyId: '',
      title: '',
      status: 'idea' as ContentStatus,
      platforms: ['instagram'] as Platform[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Reset form when piece changes
  useEffect(() => {
    if (piece) setForm({ ...piece });
  }, [piece?.id]);

  const update = <K extends keyof ContentPiece>(key: K, value: ContentPiece[K]) => {
    setForm(prev => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  const handleHashtagInput = (raw: string) => {
    const tags = raw
      .split(/[,\s]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean);
    update('hashtags', tags);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white">
              {isNew ? 'Nueva Pieza de Contenido' : 'Editar Contenido'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="¿De qué trata este contenido?"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-medium placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              autoFocus
            />
          </div>

          {/* Status + Pillar row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <div className="flex flex-wrap gap-1">
                {ALL_STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const isActive = form.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => update('status', s)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                        isActive
                          ? 'border-opacity-50'
                          : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700'
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: cfg.bgColor, borderColor: `${cfg.color}50`, color: cfg.color }
                          : undefined
                      }
                      title={cfg.label}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pillar */}
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Pilar de Contenido
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => update('pillarId', undefined)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                    !form.pillarId
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  Sin pilar
                </button>
                {pillars.map(p => {
                  const isActive = form.pillarId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => update('pillarId', p.id)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                        isActive
                          ? 'border-opacity-50'
                          : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-600 hover:text-neutral-400'
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: `${p.color}15`, borderColor: `${p.color}50`, color: p.color }
                          : undefined
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Plataformas Destino
            </label>
            <PlatformSelector
              selected={form.platforms}
              onChange={(platforms) => update('platforms', platforms)}
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar size={10} /> Fecha Programada
              </label>
              <input
                type="date"
                value={form.scheduledDate || ''}
                onChange={(e) => update('scheduledDate', e.target.value || undefined)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={10} /> Hora
              </label>
              <input
                type="time"
                value={form.scheduledTime || ''}
                onChange={(e) => update('scheduledTime', e.target.value || undefined)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={10} /> Descripción
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe el contenido, contexto, o idea..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Caption / Copy del Post
            </label>
            <textarea
              value={form.caption || ''}
              onChange={(e) => update('caption', e.target.value)}
              placeholder="El texto que acompañará la publicación..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none font-mono"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Hash size={10} /> Hashtags
            </label>
            <input
              type="text"
              value={(form.hashtags || []).map(t => `#${t}`).join(' ')}
              onChange={(e) => handleHashtagInput(e.target.value)}
              placeholder="#marketing #socialmedia #brand"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <StickyNote size={10} /> Notas Internas
            </label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Notas para el equipo..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
            />
          </div>

          {/* Linked Project */}
          {form.projectId && (
            <div className="bg-neutral-800/30 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink size={12} className="text-violet-400" />
                <span className="text-xs text-neutral-300 font-medium">
                  Proyecto vinculado: {projects.find(p => p.id === form.projectId)?.name || form.projectId}
                </span>
              </div>
              {onOpenProject && (
                <button
                  onClick={() => onOpenProject(form.projectId!)}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-medium"
                  title="Abrir en Studio"
                >
                  Abrir en Studio →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/80">
          <div>
            {!isNew && (
              <button
                onClick={() => onDelete(form.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-all"
                title="Eliminar contenido"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-lg shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={13} /> {isNew ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
