import { forwardRef } from 'react';
import { cn } from '@/utils/cn.js';
import Spinner from './Spinner.jsx';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-glow-sm hover:shadow-glow',
  secondary: 'bg-surface-2 text-text-primary hover:bg-border border border-border',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
  outline: 'border border-border text-text-secondary hover:border-accent hover:text-accent',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9',
};

const Button = forwardRef(({
  variant = 'primary', size = 'md', loading = false,
  leftIcon, rightIcon, children, className, disabled, ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      className,
    )}
    {...props}
  >
    {loading ? <Spinner size="sm" /> : leftIcon}
    {children}
    {!loading && rightIcon}
  </button>
));

Button.displayName = 'Button';
export default Button;
