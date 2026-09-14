import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center bg-surface-0 border border-border rounded-lg shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-text-muted mb-4">
        <Icon className="w-6 h-6 text-text-secondary" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-md shadow-sm transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
