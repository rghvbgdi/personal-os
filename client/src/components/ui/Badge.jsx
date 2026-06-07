import { cn } from '@/utils/cn.js';

const variants = {
  default: 'bg-surface-2 text-text-secondary border-border',
  success: 'bg-accent-subtle text-accent border-accent-muted',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
};

export default function Badge({ children, variant = 'default', className, dot = false }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
      variants[variant],
      className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-accent': variant === 'success',
        'bg-warning': variant === 'warning',
        'bg-danger': variant === 'danger',
        'bg-info': variant === 'info',
        'bg-text-muted': variant === 'default',
      })} />}
      {children}
    </span>
  );
}
