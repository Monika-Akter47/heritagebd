import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'red' | 'gold' | 'gray' | 'blue' | 'orange';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'green', size = 'md', children, className = '' }: BadgeProps) {
  const variants = {
    green: 'bg-[#006A4E]/10 text-[#006A4E] border border-[#006A4E]/20',
    red: 'bg-[#F42A41]/10 text-[#F42A41] border border-[#F42A41]/20',
    gold: 'bg-[#D4A017]/10 text-[#795800] border border-[#D4A017]/20',
    gray: 'bg-gray-100 text-gray-600 border border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
