import React from 'react';

export type CanvasActionMode = 'move' | 'scale' | 'rotate';

interface ElementActionToolbarProps {
  activeAction: CanvasActionMode;
  setActiveAction: (action: CanvasActionMode) => void;
  isLocked: boolean;
  isBrandElement: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onLock: () => void;
  counterScale?: number;
  // Keyframe props
  hasKeyframes?: boolean;
  hasKeyframeAtCurrentFrame?: boolean;
  onToggleKeyframe?: () => void;
  onPrevKeyframe?: () => void;
  onNextKeyframe?: () => void;
}

/**
 * Floating toolbar rendered above a selected canvas element.
 * Controls the active interaction mode (move/scale/rotate) and provides
 * quick actions (duplicate, lock, delete, keyframe toggle).
 */
export const ElementActionToolbar: React.FC<ElementActionToolbarProps> = ({
  activeAction,
  setActiveAction,
  isLocked,
  isBrandElement,
  onDuplicate,
  onDelete,
  onLock,
  counterScale = 1,
  hasKeyframes = false,
  hasKeyframeAtCurrentFrame = false,
  onToggleKeyframe,
  onPrevKeyframe,
  onNextKeyframe,
}) => {
  return (
    <div
      style={{
        zIndex: 50,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(23, 23, 23, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(82, 82, 82, 0.4)',
          borderRadius: 8,
          padding: '3px 4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)',
        }}
      >
        {/* ── Mode buttons ── */}
        <ToolbarBtn
          active={activeAction === 'move'}
          onClick={() => setActiveAction('move')}
          title="Mover (M)"
          disabled={isLocked}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        </ToolbarBtn>

        <ToolbarBtn
          active={activeAction === 'scale'}
          onClick={() => setActiveAction('scale')}
          title="Redimensionar (S)"
          disabled={isLocked}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </ToolbarBtn>

        <ToolbarBtn
          active={activeAction === 'rotate'}
          onClick={() => setActiveAction('rotate')}
          title="Rotar (R)"
          disabled={isLocked}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6" /><path d="M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-4.24" />
          </svg>
        </ToolbarBtn>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'rgba(82,82,82,0.5)', margin: '0 2px' }} />

        {/* ── Keyframe toggle (CapCut style) ── */}
        {hasKeyframes && onPrevKeyframe && (
          <ToolbarBtn onClick={onPrevKeyframe} title="Keyframe anterior (←)" disabled={isLocked}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </ToolbarBtn>
        )}

        {onToggleKeyframe && (
          <ToolbarBtn
            onClick={onToggleKeyframe}
            title={hasKeyframeAtCurrentFrame ? 'Eliminar keyframe' : 'Agregar keyframe'}
            active={hasKeyframeAtCurrentFrame}
            disabled={isLocked}
          >
            {/* Diamond icon ◆ */}
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path
                d="M12 2 L22 12 L12 22 L2 12 Z"
                fill={hasKeyframeAtCurrentFrame ? '#a78bfa' : 'none'}
                stroke={hasKeyframeAtCurrentFrame ? '#a78bfa' : 'currentColor'}
                strokeWidth="2"
              />
            </svg>
          </ToolbarBtn>
        )}

        {hasKeyframes && onNextKeyframe && (
          <ToolbarBtn onClick={onNextKeyframe} title="Siguiente keyframe (→)" disabled={isLocked}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </ToolbarBtn>
        )}

        {(onToggleKeyframe || hasKeyframes) && (
          <div style={{ width: 1, height: 18, background: 'rgba(82,82,82,0.5)', margin: '0 2px' }} />
        )}

        {/* ── Quick actions ── */}
        <ToolbarBtn onClick={onDuplicate} title="Duplicar (D)" disabled={isLocked}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </ToolbarBtn>

        <ToolbarBtn
          onClick={onLock}
          title={isLocked ? 'Desbloquear' : 'Bloquear'}
          active={isLocked}
        >
          {isLocked ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          )}
        </ToolbarBtn>

        {!isBrandElement && (
          <ToolbarBtn onClick={onDelete} title="Eliminar (⌫)" danger>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </ToolbarBtn>
        )}
      </div>
    </div>
  );
};

// ─── Button sub-component ──────────────────────────────

interface ToolbarBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ children, onClick, title, active, disabled, danger }) => {
  const bg = active
    ? 'rgba(139, 92, 246, 0.3)'
    : 'transparent';
  const color = danger
    ? 'rgb(248, 113, 113)'
    : active
      ? 'rgb(196, 167, 255)'
      : 'rgb(163, 163, 163)';
  const hoverBg = danger
    ? 'rgba(248, 113, 113, 0.15)'
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerDown={(e) => e.stopPropagation()}
      title={title}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: active ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid transparent',
        background: bg,
        color: color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.color = danger ? 'rgb(248, 113, 113)' : 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = bg;
          e.currentTarget.style.color = color;
        }
      }}
    >
      {children}
    </button>
  );
};
