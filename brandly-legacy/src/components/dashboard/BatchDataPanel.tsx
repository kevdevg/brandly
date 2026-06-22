/**
 * BatchDataPanel — Left panel for batch mode in ProductionForm.
 *
 * Sections:
 * 1. Header with piece count + brand note
 * 2. Multi-file background upload (defines N)
 * 3. Text data table (columns = editable fields, rows = pieces)
 * 4. CSV import button
 */
import React, { useRef, useCallback } from 'react';
import {
  FileSpreadsheet, Upload, ImageIcon, AlertTriangle,
  Trash2, Film, Video,
} from 'lucide-react';
import type { TemplateField, BatchPieceData, CompanyProfile } from '../../types';

interface BatchDataPanelProps {
  pieces: BatchPieceData[];
  editableSlots: { field: TemplateField; sceneId: string }[];
  brand: CompanyProfile;
  templateFormat: 'video' | 'image';
  onSetBackgrounds: (files: File[]) => void;
  onUpdateField: (index: number, fieldId: string, value: string) => void;
  onImportCSV: (file: File) => Promise<{ matched: number; unmatched: number }>;
  onRemovePiece: (index: number) => void;
  backgroundFiles: File[];
}

/** Get only text-type editable slots (for table columns) */
function getTextSlots(editableSlots: BatchDataPanelProps['editableSlots']) {
  return editableSlots.filter(s => s.field.type === 'text');
}

export const BatchDataPanel: React.FC<BatchDataPanelProps> = ({
  pieces,
  editableSlots,
  brand,
  templateFormat,
  onSetBackgrounds,
  onUpdateField,
  onImportCSV,
  onRemovePiece,
  backgroundFiles,
}) => {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const textSlots = getTextSlots(editableSlots);
  const isVideo = templateFormat === 'video';
  const N = pieces.length;

  // ─── Background upload handler ───
  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Merge with existing files
      const allFiles = [...backgroundFiles, ...files];
      onSetBackgrounds(allFiles);
    }
    // Reset input so re-uploading same files triggers change
    if (bgInputRef.current) bgInputRef.current.value = '';
  }, [backgroundFiles, onSetBackgrounds]);

  // ─── CSV import handler ───
  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImportCSV(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  }, [onImportCSV]);

  // ─── Max visible rows before "+N more" ───
  const MAX_VISIBLE = 8;
  const visiblePieces = pieces.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, N - MAX_VISIBLE);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-5 py-3 border-b border-neutral-800/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 shrink-0">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={13} className="text-violet-400" />
          <h2 className="text-xs font-bold text-white">Datos del lote</h2>
          {N > 0 && (
            <span className="text-[9px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full font-bold">
              {N} pieza{N !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">
          El estilo de <span className="text-amber-400">{brand.name}</span> se aplica a todas.
        </p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">

        {/* ── Background Upload ── */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium">
            {isVideo
              ? <Video size={11} className="text-sky-400" />
              : <ImageIcon size={11} className="text-sky-400" />}
            {isVideo ? 'Videos de fondo' : 'Imágenes de fondo'}
            <span className="text-red-400 text-[10px]">*</span>
          </label>

          <button
            type="button"
            onClick={() => bgInputRef.current?.click()}
            title={isVideo ? 'Subir videos de fondo (define la cantidad de piezas)' : 'Subir imágenes de fondo (define la cantidad de piezas)'}
            className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
              N > 0
                ? 'border-violet-500/30 bg-violet-950/10 hover:border-violet-500/50'
                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
            }`}
          >
            <Upload size={16} className={N > 0 ? 'text-violet-400' : 'text-neutral-600'} />
            <div className="text-left flex-1">
              {N > 0 ? (
                <span className="text-xs text-white font-medium">
                  {N} {isVideo ? 'video' : 'imagen'}{N !== 1 ? (isVideo ? 's' : 'es') : ''} cargada{N !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-neutral-500">
                  {isVideo ? 'Subir videos' : 'Subir imágenes'} (selección múltiple)
                </span>
              )}
            </div>
            {N > 0 && (
              <span className="text-[9px] text-neutral-500">+ agregar</span>
            )}
          </button>
          <input
            ref={bgInputRef}
            type="file"
            accept={isVideo ? 'video/*' : 'image/*'}
            multiple
            className="hidden"
            onChange={handleBgUpload}
          />
          <p className="text-[9px] text-neutral-600">
            Definen la cantidad de piezas.
          </p>
        </div>

        {/* ── Text Data Table ── */}
        {textSlots.length > 0 && N > 0 && (
          <div className="space-y-2">
            {/* Table header with CSV import */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {textSlots.map(({ field }) => (
                  <span key={field.id} className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <span className="text-[11px] font-medium text-neutral-300">{field.label}</span>
                    {field.required && <span className="text-red-400 text-[8px]">*</span>}
                  </span>
                )).reduce<React.ReactNode[]>((acc, el, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`} className="text-neutral-700 text-[8px]">·</span>);
                  acc.push(el);
                  return acc;
                }, [])}
              </div>
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                title="Importar datos desde CSV"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <FileSpreadsheet size={10} />
                Importar CSV
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleCSVUpload}
              />
            </div>

            {/* Data table */}
            <div className="rounded-lg border border-neutral-800/60 overflow-hidden">
              {/* Table header row */}
              <div
                className="grid gap-px bg-neutral-800/50 text-[9px] text-neutral-500 font-bold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: `36px 90px ${textSlots.map(() => '1fr').join(' ')} 28px`,
                }}
              >
                <div className="bg-neutral-900/80 px-2 py-1.5 text-center">#</div>
                <div className="bg-neutral-900/80 px-2 py-1.5">Fondo</div>
                {textSlots.map(({ field }) => (
                  <div key={field.id} className="bg-neutral-900/80 px-2 py-1.5 truncate">
                    {field.label}
                  </div>
                ))}
                <div className="bg-neutral-900/80 px-1 py-1.5" />
              </div>

              {/* Data rows */}
              {visiblePieces.map((piece) => {
                const hasErrors = Object.keys(piece.errors).length > 0;
                return (
                  <div
                    key={piece.index}
                    className={`grid gap-px text-xs ${
                      hasErrors ? 'bg-red-500/5' : 'bg-neutral-800/20'
                    }`}
                    style={{
                      gridTemplateColumns: `36px 90px ${textSlots.map(() => '1fr').join(' ')} 28px`,
                    }}
                  >
                    {/* Row number */}
                    <div className="bg-neutral-900/60 px-2 py-1.5 text-center text-neutral-500 text-[10px] font-mono flex items-center justify-center">
                      {piece.index + 1}
                    </div>

                    {/* Background filename */}
                    <div className="bg-neutral-900/60 px-2 py-1.5 flex items-center gap-1 min-w-0">
                      <span className="text-[9px] text-neutral-400 truncate font-mono">
                        {piece.backgroundFilename}
                      </span>
                    </div>

                    {/* Text fields */}
                    {textSlots.map(({ field }) => {
                      const val = piece.fieldData[field.id] || '';
                      const err = piece.errors[field.id];
                      return (
                        <div key={field.id} className="bg-neutral-900/60 px-0.5 py-0.5 flex items-center">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => onUpdateField(piece.index, field.id, e.target.value)}
                            placeholder={field.content || field.label}
                            title={err || field.label}
                            className={`w-full bg-transparent px-1.5 py-1 rounded text-[10px] text-white placeholder-neutral-600 focus:outline-none focus:bg-neutral-800/50 transition-colors ${
                              err ? 'text-red-400 ring-1 ring-red-500/30' : ''
                            }`}
                            style={{ fontFamily: 'inherit' }}
                          />
                        </div>
                      );
                    })}

                    {/* Delete row */}
                    <div className="bg-neutral-900/60 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onRemovePiece(piece.index)}
                        title="Quitar pieza"
                        className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Overflow indicator */}
              {overflowCount > 0 && (
                <div className="bg-neutral-900/40 px-3 py-2 text-center text-[10px] text-neutral-500">
                  + {overflowCount} fila{overflowCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Validation summary */}
            {pieces.some(p => !p.isValid) && (
              <div className="flex items-center gap-1.5 text-[9px] text-amber-400">
                <AlertTriangle size={10} />
                <span>
                  {pieces.filter(p => !p.isValid).length} pieza{pieces.filter(p => !p.isValid).length !== 1 ? 's' : ''} con datos faltantes
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state (no text fields) ── */}
        {textSlots.length === 0 && N > 0 && (
          <div className="text-center py-4">
            <p className="text-[10px] text-neutral-500">
              Esta plantilla no tiene campos de texto editables.
            </p>
            <p className="text-[9px] text-neutral-600 mt-1">
              Solo se varía el fondo en cada pieza.
            </p>
          </div>
        )}

        {/* ── Empty state (no backgrounds yet) ── */}
        {N === 0 && (
          <div className="text-center py-8">
            <Upload size={24} className="text-neutral-700 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">
              Sube {isVideo ? 'videos' : 'imágenes'} de fondo para comenzar
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">
              La cantidad define cuántas piezas se generan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
