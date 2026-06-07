import { cn } from '@/utils/cn.js';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-border shadow-card',
        hover && 'transition-all duration-200 hover:border-border hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('px-5 pt-5 pb-4 border-b border-border', className)}>{children}</div>;
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn('px-5 py-4 border-t border-border', className)}>{children}</div>;
}
