import { cn } from '@/utils/cn.js';

export default function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-surface-2', className)} />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center px-4 py-3 rounded-lg bg-surface">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
