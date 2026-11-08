import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="text-4xl mb-4 opacity-40">{icon}</div>}
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}
