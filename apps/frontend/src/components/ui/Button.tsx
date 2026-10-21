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
    'touch-target inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none shadow-sm';

  const sizeStyles = {
    sm: 'text-sm px-3 py-2 min-h-[40px]',
    md: 'text-base px-5 py-3 min-h-[48px]',
    lg: 'text-lg px-6 py-4 min-h-[56px] font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-kirana-600 text-white hover:bg-kirana-700 active:bg-kirana-800 shadow-kirana-600/20',
    secondary:
      'bg-kirana-100 text-kirana-800 hover:bg-kirana-200 active:bg-kirana-300',
    outline:
      'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    saffron:
      'bg-saffron-500 text-white hover:bg-saffron-600 active:bg-saffron-700 shadow-saffron-500/25',
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
