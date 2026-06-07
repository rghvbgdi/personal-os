import { forwardRef } from 'react';
import { cn } from '@/utils/cn.js';

const Textarea = forwardRef(({ label, error, containerClassName, className, ...props }, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary',
        'placeholder:text-text-muted resize-none',
        'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150',
        'disabled:opacity-50',
        error && 'border-danger',
        className,
      )}
      rows={4}
      {...props}
    />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';
export default Textarea;
