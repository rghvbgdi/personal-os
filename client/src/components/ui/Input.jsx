import { forwardRef } from 'react';
import { cn } from '@/utils/cn.js';

const Input = forwardRef(({
  label, error, hint, leftIcon, rightIcon, className, containerClassName, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && (
      <label className="text-sm font-medium text-text-secondary">
        {label}
      </label>
    )}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary',
          'placeholder:text-text-muted',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          leftIcon && 'pl-9',
          rightIcon && 'pr-9',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
          {rightIcon}
        </span>
      )}
    </div>
    {error && <p className="text-xs text-danger">{error}</p>}
    {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
