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
  sm: 'min-h-[36px] px-3 text-xs font-semibold gap-1.5',
  md: 'min-h-[44px] px-5 py-3 text-sm font-semibold gap-2',
  lg: 'min-h-[50px] px-6 py-3 text-base font-semibold gap-2',
  icon: 'h-11 w-11',
};

const Button = forwardRef(({
  variant = 'primary', size = 'md', loading = false,
  leftIcon, rightIcon, children, className, disabled, ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
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
