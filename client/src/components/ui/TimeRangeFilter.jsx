import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn.js';

/**
 * TimeRangeFilter — Horizontally scrollable pill selector (iPhone 14 Pro optimized)
 * Pills: Year (default) → Month → Week
 * Emits: { startDate, endDate, timeRange, label }
 */

const PILLS = [
  { value: 'yearly',  label: 'Year'  },
  { value: 'monthly', label: 'Month' },
  { value: 'weekly',  label: 'Week'  },
];

function getRange(timeRange, targetMonth, targetYear) {
  const now = new Date();
  let startDate, endDate, label;

  if (timeRange === 'weekly') {
    const day = now.getDay();
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
  } else {
    // yearly (default)
    const y = Number(targetYear);
    startDate = new Date(y, 0, 1).toISOString();
    endDate   = new Date(y, 11, 31, 23, 59, 59, 999).toISOString();
    label     = String(y);
  }
  return { startDate, endDate, timeRange, label };
}

export default function TimeRangeFilter({ onChange, defaultRange = 'yearly' }) {
  const initialRange = PILLS.find((p) => p.value === defaultRange) ? defaultRange : 'yearly';
  const [timeRange, setTimeRange]     = useState(initialRange);
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [targetYear, setTargetYear]   = useState(new Date().getFullYear().toString());

  useEffect(() => {
    onChange(getRange(timeRange, targetMonth, targetYear));
  }, [timeRange, targetMonth, targetYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2.5">
      {/* Pill row */}
      <div className="flex gap-2">
        {PILLS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={cn(
              'flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 touch-manipulation select-none',
              timeRange === value
                ? 'bg-[#059669] text-white border-[#059669] shadow-[0_0_12px_rgba(5,150,105,0.3)]'
                : 'bg-[#111] text-[#666] border-[#222] hover:border-[#333] hover:text-[#999]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month picker */}
      {timeRange === 'monthly' && (
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#222] bg-[#111] text-[#ccc] focus:outline-none focus:border-[#059669] transition-colors"
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
          className="w-24 px-3 py-2.5 text-sm rounded-xl border border-[#222] bg-[#111] text-[#ccc] focus:outline-none focus:border-[#059669] transition-colors"
        />
      )}
    </div>
  );
}
