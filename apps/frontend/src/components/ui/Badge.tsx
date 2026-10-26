import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'neutral' | 'info' | 'danger';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    danger: 'bg-rose-50 text-rose-900 border-rose-300',
  };

  const dotColors = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    neutral: 'bg-slate-500',
    info: 'bg-blue-600',
    danger: 'bg-rose-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
