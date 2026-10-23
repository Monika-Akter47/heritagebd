import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = '#006A4E' }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div role="status" aria-label="Loading" className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200`} style={{ borderTopColor: color }} />
  );
}
