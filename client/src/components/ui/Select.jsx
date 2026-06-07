import { forwardRef } from 'react';
import { cn } from '@/utils/cn.js';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label, error, options = [], placeholder = 'Select...', containerClassName, className, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-lg bg-surface border border-border px-3 py-2 pr-9 text-sm text-text-primary',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
    </div>
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;
