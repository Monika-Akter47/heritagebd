import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#006A4E] text-white hover:bg-[#004D38] focus:ring-[#006A4E] active:scale-95',
    secondary: 'bg-[#D4A017] text-[#1A1A2E] hover:bg-[#b88a10] focus:ring-[#D4A017] active:scale-95',
    outline: 'border-2 border-[#006A4E] text-[#006A4E] hover:bg-[#006A4E] hover:text-white focus:ring-[#006A4E] active:scale-95',
    ghost: 'text-[#006A4E] hover:bg-[#006A4E]/10 focus:ring-[#006A4E] active:scale-95',
    accent: 'bg-[#F42A41] text-white hover:bg-[#d41f34] focus:ring-[#F42A41] active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <>
          <svg aria-hidden="true" className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="sr-only" role="status" aria-live="polite">Loading</span>
        </>
      )}
      {children}
    </button>
  );
}
