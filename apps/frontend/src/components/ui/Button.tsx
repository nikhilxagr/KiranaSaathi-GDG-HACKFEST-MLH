import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'saffron';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'touch-target inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none shadow-xs focus-visible:ring-2 focus-visible:ring-kirana-700 focus-visible:ring-offset-2 focus-visible:outline-none';

  const sizeStyles = {
    sm: 'text-xs sm:text-sm px-3 py-2 min-h-[44px]',
    md: 'text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-3 min-h-[48px]',
    lg: 'text-base sm:text-lg px-6 py-3.5 min-h-[52px] font-bold',
  };

  const variantStyles = {
    primary:
      'bg-kirana-700 text-white hover:bg-kirana-800 active:bg-kirana-900 shadow-xs',
    secondary:
      'bg-kirana-100 text-kirana-900 hover:bg-kirana-200 active:bg-kirana-300 border border-kirana-200',
    outline:
      'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100',
    saffron:
      'bg-saffron-600 text-white hover:bg-saffron-500 active:bg-saffron-600 shadow-xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
