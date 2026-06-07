import { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * TimeRangeFilter — Month / Year only (Day removed as it's too granular)
 * Emits: { startDate, endDate, timeRange, label }
 */
export default function TimeRangeFilter({ onChange, defaultRange = 'monthly' }) {
  const [timeRange, setTimeRange]     = useState(defaultRange === 'yearly' ? 'yearly' : 'monthly');
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [targetYear, setTargetYear]   = useState(new Date().getFullYear().toString());

  useEffect(() => {
    let startDate, endDate, label;
    if (timeRange === 'monthly') {
      const [y, m] = targetMonth.split('-').map(Number);
      startDate = new Date(y, m - 1, 1).toISOString();
      endDate   = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
      label     = format(new Date(y, m - 1, 1), 'MMMM yyyy');
    } else if (timeRange === 'yearly') {
      const y = Number(targetYear);
      startDate = new Date(y, 0, 1).toISOString();
      endDate   = new Date(y, 11, 31, 23, 59, 59, 999).toISOString();
      label     = String(y);
    } else {
      // 'all'
      startDate = null;
      endDate   = null;
      label     = 'All Time';
    }
    onChange({ startDate, endDate, timeRange, label });
  }, [timeRange, targetMonth, targetYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-1.5">
      {/* Range type pills */}
      <div className="flex rounded-lg border border-border bg-surface-2 overflow-hidden">
        {[
          { value: 'monthly', label: 'Month' },
          { value: 'yearly',  label: 'Year'  },
          { value: 'all',     label: 'All'   },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={[
              'px-3 py-1.5 text-xs font-semibold transition-all border-r last:border-r-0 border-border',
              timeRange === value
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary hover:bg-surface',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date picker */}
      {timeRange === 'monthly' && (
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
      )}
      {timeRange === 'yearly' && (
        <input
          type="number"
          min="2000" max="2100"
          value={targetYear}
          onChange={(e) => setTargetYear(e.target.value)}
          className="w-20 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
      )}
    </div>
  );
}
