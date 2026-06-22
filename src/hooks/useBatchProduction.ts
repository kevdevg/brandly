/**
 * useBatchProduction — Central hook for batch mode in the content producer.
 *
 * Manages:
 * - Toggle between single/batch mode
 * - N pieces derived from background uploads
 * - Per-piece field data (text values)
 * - CSV/Excel import with column→field mapping
 * - Background ↔ row matching (by filename with order fallback)
 * - Validation of all pieces
 */
import { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import type { BatchPieceData, TemplateField } from '../types';

/** Column names that identify the background filename column in CSV */
const BG_COLUMN_ALIASES = ['fondo', 'background', 'filename', 'archivo', 'file', 'imagen', 'image', 'video'];

export interface UseBatchProductionResult {
  isBatchMode: boolean;
  toggleBatchMode: () => void;
  pieces: BatchPieceData[];
  backgroundFiles: File[];
  pieceCount: number;
  allValid: boolean;
  validCount: number;
  invalidCount: number;
  setBackgroundFiles: (files: File[]) => void;
  updatePieceField: (index: number, fieldId: string, value: string) => void;
  importCSV: (file: File) => Promise<{ matched: number; unmatched: number }>;
  removePiece: (index: number) => void;
  clearBatch: () => void;
  validateAll: () => boolean;
}

export function useBatchProduction(
  editableSlots: { field: TemplateField; sceneId: string }[],
  templateFormat: 'video' | 'image',
): UseBatchProductionResult {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [backgroundFiles, setBackgroundFilesState] = useState<File[]>([]);
  const [pieces, setPieces] = useState<BatchPieceData[]>([]);

  // ─── Toggle ───
  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
  }, []);

  // ─── Background upload (defines N) ───
  const setBackgroundFiles = useCallback((files: File[]) => {
    setBackgroundFilesState(files);

    // Create or resize pieces array to match file count
    setPieces(prev => {
      const newPieces: BatchPieceData[] = files.map((file, i) => {
        const existing = prev[i];
        return {
          index: i,
          backgroundUrl: URL.createObjectURL(file),
          backgroundFilename: file.name,
          // Preserve existing field data if piece already existed
          fieldData: existing?.fieldData ?? {},
          isValid: true,
          errors: {},
        };
      });
      // Revoke old blob URLs that are no longer used
      for (let i = files.length; i < prev.length; i++) {
        if (prev[i]?.backgroundUrl) {
          URL.revokeObjectURL(prev[i].backgroundUrl);
        }
      }
      return newPieces;
    });
  }, []);

  // ─── Update a single field in a single piece ───
  const updatePieceField = useCallback((index: number, fieldId: string, value: string) => {
    setPieces(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const newFieldData = { ...p.fieldData, [fieldId]: value };
      // Clear error for this field
      const newErrors = { ...p.errors };
      delete newErrors[fieldId];
      return { ...p, fieldData: newFieldData, errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
    }));
  }, []);

  // ─── Validate all pieces ───
  const validateAll = useCallback((): boolean => {
    let allOk = true;
    setPieces(prev => prev.map(piece => {
      const errors: Record<string, string> = {};
      for (const { field } of editableSlots) {
        if (field.type === 'image' || field.type === 'video') continue; // Background handled separately
        const val = piece.fieldData[field.id]?.trim();
        if (field.required && !val) {
          errors[field.id] = 'Campo obligatorio';
        }
        if (field.type === 'text' && field.rules?.maxChars && val && val.length > field.rules.maxChars) {
          errors[field.id] = `Máximo ${field.rules.maxChars} caracteres`;
        }
      }
      // Check background
      if (!piece.backgroundUrl) {
        errors['__background__'] = 'Falta fondo';
      }
      const isValid = Object.keys(errors).length === 0;
      if (!isValid) allOk = false;
      return { ...piece, errors, isValid };
    }));
    return allOk;
  }, [editableSlots]);

  // ─── Import CSV ───
  const importCSV = useCallback(async (file: File): Promise<{ matched: number; unmatched: number }> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          if (rows.length === 0) {
            resolve({ matched: 0, unmatched: 0 });
            return;
          }

          // Detect background filename column
          const csvColumns = Object.keys(rows[0] || {});
          const bgColumnName = csvColumns.find(col =>
            BG_COLUMN_ALIASES.includes(col.toLowerCase().trim())
          );

          // Build label → fieldId map (case-insensitive)
          const labelToFieldId = new Map<string, string>();
          for (const { field } of editableSlots) {
            if (field.type !== 'image' && field.type !== 'video') {
              labelToFieldId.set(field.label.toLowerCase().trim(), field.id);
            }
          }

          // Map CSV columns to field IDs
          const colToFieldId = new Map<string, string>();
          for (const col of csvColumns) {
            const normalized = col.toLowerCase().trim();
            if (BG_COLUMN_ALIASES.includes(normalized)) continue; // Skip bg column
            const fieldId = labelToFieldId.get(normalized);
            if (fieldId) {
              colToFieldId.set(col, fieldId);
            }
          }

          let matched = 0;
          let unmatched = 0;

          setPieces(prev => {
            const updated = [...prev];
            // Track which pieces have been matched to avoid re-overwriting
            const matchedIndices = new Set<number>();

            for (const row of rows) {
              let targetIndex = -1;

              // Strategy 1: Match by filename
              if (bgColumnName) {
                const csvFilename = row[bgColumnName]?.trim();
                if (csvFilename) {
                  targetIndex = updated.findIndex(p =>
                    p.backgroundFilename === csvFilename ||
                    p.backgroundFilename.replace(/\.[^.]+$/, '') === csvFilename.replace(/\.[^.]+$/, '')
                  );
                }
              }

              // Strategy 2: Fallback to order (assign to first unmatched piece without text data)
              if (targetIndex === -1) {
                targetIndex = updated.findIndex((p, i) => {
                  if (matchedIndices.has(i)) return false;
                  const hasData = (Object.values(p.fieldData) as string[]).some(v => v?.trim());
                  return !hasData;
                });
              }

              if (targetIndex >= 0 && targetIndex < updated.length) {
                const piece = updated[targetIndex];
                const newFieldData = { ...piece.fieldData };
                for (const [col, fieldId] of colToFieldId) {
                  if (row[col] !== undefined && row[col] !== '') {
                    newFieldData[fieldId] = row[col];
                  }
                }
                updated[targetIndex] = { ...piece, fieldData: newFieldData };
                matchedIndices.add(targetIndex);
                matched++;
              } else {
                unmatched++;
              }
            }

            return updated;
          });

          resolve({ matched, unmatched });
        },
        error: () => {
          resolve({ matched: 0, unmatched: 0 });
        },
      });
    });
  }, [editableSlots]);

  // ─── Remove a single piece ───
  const removePiece = useCallback((index: number) => {
    setPieces(prev => {
      const piece = prev[index];
      if (piece?.backgroundUrl) URL.revokeObjectURL(piece.backgroundUrl);
      return prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i }));
    });
    setBackgroundFilesState(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Clear all ───
  const clearBatch = useCallback(() => {
    pieces.forEach(p => { if (p.backgroundUrl) URL.revokeObjectURL(p.backgroundUrl); });
    setPieces([]);
    setBackgroundFilesState([]);
  }, [pieces]);

  // ─── Derived ───
  const pieceCount = pieces.length;
  const validCount = useMemo(() => pieces.filter(p => p.isValid).length, [pieces]);
  const invalidCount = pieceCount - validCount;
  const allValid = pieceCount > 0 && invalidCount === 0;

  return {
    isBatchMode,
    toggleBatchMode,
    pieces,
    backgroundFiles,
    pieceCount,
    allValid,
    validCount,
    invalidCount,
    setBackgroundFiles,
    updatePieceField,
    importCSV,
    removePiece,
    clearBatch,
    validateAll,
  };
}
