import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-[#006A4E]/30">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      {description && <p className="text-[var(--color-text-muted)] text-sm mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
