import React from 'react';
import { ContentStatus } from '../../types';
import { STATUS_CONFIG } from '../../data/defaults';

interface StatusBadgeProps {
  status: ContentStatus;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/**
 * Color-coded badge for content workflow status.
 * Displays the localized label with a matching pill color.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', onClick }) => {
  const config = STATUS_CONFIG[status];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-semibold rounded-full border transition-all select-none ${
        onClick ? 'cursor-pointer hover:brightness-125' : ''
      } ${
        size === 'sm'
          ? 'text-[10px] px-2 py-0.5'
          : 'text-xs px-2.5 py-1'
      }`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: `${config.color}30`,
      }}
      title={`Estado: ${config.label}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};
