import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ScrubInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  /** Sensitivity: how many pixels of drag = 1 unit change */
  sensitivity?: number;
}

/**
 * Numeric input with drag-to-scrub, scroll-to-adjust, and click-to-edit.
 * Inspired by After Effects / Figma property inputs.
 */
export const ScrubInput: React.FC<ScrubInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix = '',
  label,
  sensitivity = 2,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; startValue: number } | null>(null);

  // Click to edit
  const handleDoubleClick = useCallback(() => {
    setEditValue(String(Math.round(value * 10) / 10));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  }, [value]);

  // Commit edit
  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setIsEditing(false);
  }, [editValue, onChange, min, max]);

  // Handle key in edit mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const inc = e.shiftKey ? step * 10 : step;
      const newVal = Math.min(max, parseFloat(editValue || '0') + inc);
      setEditValue(String(Math.round(newVal * 10) / 10));
      onChange(newVal);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const inc = e.shiftKey ? step * 10 : step;
      const newVal = Math.max(min, parseFloat(editValue || '0') - inc);
      setEditValue(String(Math.round(newVal * 10) / 10));
      onChange(newVal);
    }
  }, [commitEdit, editValue, onChange, min, max, step]);

  // Drag to scrub
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isEditing) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, startValue: value };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isEditing, value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || isEditing) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const multiplier = e.shiftKey ? 0.1 : 1; // Shift for fine control
    const deltaValue = (deltaX / sensitivity) * step * multiplier;
    const newValue = Math.max(min, Math.min(max, dragStartRef.current.startValue + deltaValue));
    onChange(Math.round(newValue * 10) / 10);
  }, [isEditing, sensitivity, step, min, max, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const totalDelta = Math.abs(e.clientX - dragStartRef.current.x);
    // If barely moved, treat as a click → enter edit mode
    if (totalDelta < 3) {
      handleDoubleClick();
    }
    dragStartRef.current = null;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [handleDoubleClick]);

  // Scroll to adjust
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isEditing) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const multiplier = e.shiftKey ? 10 : 1;
    const newValue = Math.max(min, Math.min(max, value + direction * step * multiplier));
    onChange(Math.round(newValue * 10) / 10);
  }, [isEditing, value, step, min, max, onChange]);

  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-[9px] text-neutral-500 w-3 shrink-0 select-none">{label}</span>
      )}
      <div
        className={`relative flex-1 bg-neutral-900 border rounded px-1.5 py-0.5 text-[10px] font-mono transition-all select-none ${
          isDragging
            ? 'border-violet-500 bg-violet-500/10'
            : isEditing
            ? 'border-violet-500'
            : 'border-neutral-700/50 hover:border-neutral-600'
        }`}
        style={{ cursor: isEditing ? 'text' : 'ew-resize' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white text-[10px] font-mono outline-none"
            autoFocus
          />
        ) : (
          <span className="text-neutral-200 pointer-events-none">
            {Math.round(value * 10) / 10}{suffix && <span className="text-neutral-500 ml-0.5">{suffix}</span>}
          </span>
        )}
      </div>
    </div>
  );
};
