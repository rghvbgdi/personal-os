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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          // min-h-[44px] for iOS HIG, text-base (16px) prevents iOS zoom-on-focus
          'w-full min-h-[44px] rounded-xl bg-surface border border-border px-4 py-3 text-base text-text-primary',
          'placeholder:text-text-muted',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
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
