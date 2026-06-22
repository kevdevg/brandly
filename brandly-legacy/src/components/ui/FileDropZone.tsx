import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileDropZoneProps {
  /** MIME accept string, e.g. "image/*", "video/*", "audio/*" */
  accept: string;
  /** Allow selecting multiple files */
  multiple?: boolean;
  /** Callback with the selected/dropped files */
  onFiles: (files: File[]) => void;
  /** Primary label text */
  label?: string;
  /** Secondary label text */
  sublabel?: string;
  /** Custom icon — defaults to UploadCloud */
  icon?: React.ReactNode;
  /** Compact mode renders as a small inline button */
  compact?: boolean;
  /** Disable interactions */
  disabled?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * Reusable file upload component with drag-and-drop support.
 *
 * Two modes:
 * - **Default**: Large drop zone with icon, label, and sublabel
 * - **Compact**: Small inline button that still supports drag-and-drop
 *
 * Both modes support click-to-browse and drag-and-drop.
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept,
  multiple = false,
  onFiles,
  label,
  sublabel,
  icon,
  compact = false,
  disabled = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    // Filter by accept types if possible
    const filtered = filterByAccept(files, accept);
    if (filtered.length > 0) {
      onFiles(multiple ? filtered : [filtered[0]]);
    }
  }, [accept, multiple, onFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const defaultLabel = label || (multiple ? 'Subir archivos' : 'Subir archivo');
  const defaultSublabel = sublabel || 'o arrastra aquí';
  const iconElement = icon || <UploadCloud size={compact ? 14 : 24} />;

  // ─── Compact mode ───
  if (compact) {
    return (
      <div
        className={`relative ${className}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          title={defaultLabel}
          className={`w-full bg-neutral-950 border rounded-lg py-1.5 text-center text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            isDragOver
              ? 'border-violet-500 bg-violet-500/10 text-violet-300 ring-2 ring-violet-500/20'
              : 'border-neutral-700 hover:border-violet-500 text-neutral-300 hover:text-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {iconElement}
          {isDragOver ? 'Suelta aquí' : defaultLabel}
        </button>
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
      </div>
    );
  }

  // ─── Default mode (large drop zone) ───
  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={defaultLabel}
        className={`w-full rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all border-2 border-dashed ${
          isDragOver
            ? 'border-violet-500 bg-violet-500/10 text-violet-300 ring-2 ring-violet-500/20 scale-[1.01]'
            : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`transition-transform ${isDragOver ? 'scale-110 -translate-y-1' : ''}`}>
          {iconElement}
        </div>
        <span className="text-sm font-medium">
          {isDragOver ? 'Suelta el archivo aquí' : defaultLabel}
        </span>
        {!isDragOver && (
          <span className="text-xs text-neutral-500">{defaultSublabel}</span>
        )}
      </button>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
      />
    </div>
  );
};

// ─── Helpers ───

/** Filter files by a MIME accept string (basic matching for common patterns) */
function filterByAccept(files: File[], accept: string): File[] {
  if (!accept || accept === '*') return files;

  const patterns = accept.split(',').map(p => p.trim().toLowerCase());

  return files.filter(file => {
    const type = file.type.toLowerCase();
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

    return patterns.some(pattern => {
      // Wildcard: "image/*", "video/*", "audio/*"
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2);
        return type.startsWith(prefix);
      }
      // Exact MIME: "image/png"
      if (pattern.includes('/')) {
        return type === pattern;
      }
      // Extension: ".mp3", ".png"
      if (pattern.startsWith('.')) {
        return ext === pattern;
      }
      return false;
    });
  });
}
