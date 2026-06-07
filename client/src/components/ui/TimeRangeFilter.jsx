import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn.js';

/**
 * TimeRangeFilter — Horizontally scrollable pill selector (mobile-first)
 * Emits: { startDate, endDate, timeRange, label }
 */

const PILLS = [
  { value: 'weekly',  label: 'Week'  },
  { value: 'monthly', label: 'Month' },
  { value: '3m',      label: '3M'    },
  { value: '6m',      label: '6M'    },
  { value: 'yearly',  label: 'Year'  },
];

function getRange(timeRange, targetMonth, targetYear) {
  const now = new Date();
  let startDate, endDate, label;

  if (timeRange === 'weekly') {
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    startDate = monday.toISOString();
    endDate   = sunday.toISOString();
    label     = 'This Week';
  } else if (timeRange === 'monthly') {
    const [y, m] = targetMonth.split('-').map(Number);
    startDate = new Date(y, m - 1, 1).toISOString();
    endDate   = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    label     = format(new Date(y, m - 1, 1), 'MMMM yyyy');
  } else if (timeRange === '3m') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    startDate = start.toISOString();
    endDate   = end.toISOString();
    label     = 'Last 3 Months';
  } else if (timeRange === '6m') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    startDate = start.toISOString();
    endDate   = end.toISOString();
    label     = 'Last 6 Months';
  } else if (timeRange === 'yearly') {
    const y = Number(targetYear);
    startDate = new Date(y, 0, 1).toISOString();
    endDate   = new Date(y, 11, 31, 23, 59, 59, 999).toISOString();
    label     = String(y);
  } else {
    startDate = null;
    endDate   = null;
    label     = 'All Time';
  }
  return { startDate, endDate, timeRange, label };
}

export default function TimeRangeFilter({ onChange, defaultRange = 'monthly' }) {
  const initialRange = PILLS.find((p) => p.value === defaultRange) ? defaultRange : 'monthly';
  const [timeRange, setTimeRange]     = useState(initialRange);
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [targetYear, setTargetYear]   = useState(new Date().getFullYear().toString());

  useEffect(() => {
    onChange(getRange(timeRange, targetMonth, targetYear));
  }, [timeRange, targetMonth, targetYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      {/* Pill row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {PILLS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200',
              timeRange === value
                ? 'bg-accent text-white border-accent shadow-glow-sm'
                : 'bg-surface-2 text-text-secondary border-border hover:border-accent/50 hover:text-text-primary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month picker — only shown when "Month" is active */}
      {timeRange === 'monthly' && (
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
      )}

      {/* Year picker */}
      {timeRange === 'yearly' && (
        <input
          type="number"
          min="2000"
          max="2100"
          value={targetYear}
          onChange={(e) => setTargetYear(e.target.value)}
          className="w-24 px-3 py-2 text-xs rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
      )}
    </div>
  );
}
