import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn.js';

const MODES = [
  { value: 'yearly',  label: 'Year'  },
  { value: 'monthly', label: 'Month' },
  { value: 'weekly',  label: 'Week'  },
];

function getRange(mode, year, month) {
  if (mode === 'weekly') {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { startDate: monday.toISOString(), endDate: sunday.toISOString(), timeRange: 'weekly', label: 'This Week' };
  }
  if (mode === 'monthly') {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), timeRange: 'monthly', label: format(start, 'MMMM yyyy') };
  }
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31, 23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString(), timeRange: 'yearly', label: String(year) };
}

export default function TimeRangeFilter({ onChange, defaultRange = 'yearly' }) {
  const now = new Date();
  const [mode, setMode]   = useState(defaultRange);
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    onChange(getRange(mode, year, month));
  }, [mode, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevPeriod = () => {
    if (mode === 'yearly') { setYear((y) => y - 1); return; }
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextPeriod = () => {
    if (mode === 'yearly') { setYear((y) => y + 1); return; }
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const periodLabel = mode === 'yearly'
    ? String(year)
    : mode === 'monthly'
      ? format(new Date(year, month - 1, 1), 'MMM yyyy')
      : 'This Week';

  return (
    <div className="flex items-center gap-2">
      {/* Compact mode selector */}
      <div className="flex rounded-xl border border-border bg-surface-2 p-0.5">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={cn(
              'px-3 py-1.5 rounded-[9px] text-[11px] font-semibold transition-all duration-150 touch-manipulation select-none',
              mode === value
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period navigator — hidden in weekly mode */}
      {mode !== 'weekly' && (
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={prevPeriod}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors touch-manipulation"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-semibold text-text-primary w-[80px] text-center select-none">
            {periodLabel}
          </span>
          <button
            onClick={nextPeriod}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors touch-manipulation"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
