import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pencil, Check, X, TrendingDown, AlertTriangle, ShieldCheck, Flame, ExternalLink } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import TimeRangeFilter from '@/components/ui/TimeRangeFilter.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { budgetApi } from '@/api/index.js';
import { EXPENSE_CATEGORIES, QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';
import { evaluateMath } from '@/components/ui/MathInput.jsx';

// ── Status helpers ─────────────────────────────────────────────────────────────
function getBurnStatus(pct) {
  if (pct >= 100) return { label: 'Over budget',  color: '#ef4444', textColor: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', icon: Flame };
  if (pct >= 80)  return { label: 'Almost there', color: '#f59e0b', textColor: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', icon: AlertTriangle };
  if (pct >= 50)  return { label: 'On track',     color: '#3b82f6', textColor: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', icon: TrendingDown };
  return             { label: 'Healthy',       color: '#059669', textColor: 'text-[#059669]', bg: 'bg-[#059669]/10', icon: ShieldCheck };
}

// ── Animated bar ────────────────────────────────────────────────────────────
function BurnBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="relative h-2 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
      />
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryBudgetRow({ cat, limit, spent, onSave, onNavigate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]   = useState(limit || '');

  const pct      = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const status   = getBurnStatus(limit > 0 ? pct : 0);
  const StatusIcon = status.icon;
  const remaining = (limit || 0) - spent;
  const hasData   = spent > 0;

  const handleSave = () => {
    const computed = evaluateMath(String(value));
    setValue(computed);
    const num = parseFloat(computed);
    if (isNaN(num) || num < 0) return toast.error('Enter a valid amount');
    onSave(cat.value, num);
    setEditing(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border bg-[#111] p-4 transition-all duration-200',
        pct >= 100 ? 'border-[#ef4444]/25' : pct >= 80 ? 'border-[#f59e0b]/25' : 'border-[#1e1e1e]',
      )}
    >
      {/* Row: icon + name + status + edit/amount */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Category icon */}
          <button
            onClick={() => onNavigate(cat.value)}
            title={`View ${cat.label} expenses`}
            className="text-xl leading-none flex-shrink-0 touch-manipulation"
          >
            {cat.icon}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-[#e0e0e0] truncate">{cat.label}</p>
              {hasData && (
                <button
                  onClick={() => onNavigate(cat.value)}
                  title="View expenses"
                  className="touch-manipulation"
                >
                  <ExternalLink className="h-3 w-3 text-[#333] hover:text-[#059669]" />
                </button>
              )}
            </div>
            {limit > 0 ? (
              <div className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold mt-0.5', status.bg, status.textColor)}>
                <StatusIcon className="h-2.5 w-2.5" />
                {status.label}
              </div>
            ) : hasData ? (
              <p className="text-[10px] text-[#444] mt-0.5">No limit set</p>
            ) : null}
          </div>
        </div>

        {/* Edit / Display */}
        <div className="flex-shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#444]">₹</span>
                <input
                  autoFocus type="text" inputMode="decimal" value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => setValue(evaluateMath(String(value)))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                  className="w-28 pl-6 pr-2 py-1.5 text-sm bg-[#1a1a1a] border border-[#059669] rounded-xl text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#059669]/40"
                />
              </div>
              <button onClick={handleSave} className="p-1.5 rounded-lg bg-[#059669] text-white hover:opacity-90 transition-opacity touch-manipulation">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#555] hover:text-[#888] transition-colors touch-manipulation">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <p className="text-sm font-bold text-[#e0e0e0]">
                  {limit > 0 ? formatCurrency(limit) : <span className="text-[#444] font-normal text-xs">Not set</span>}
                </p>
                {hasData && (
                  <p className={cn('text-xs font-medium', pct >= 100 ? 'text-[#ef4444]' : 'text-[#444]')}>
                    {formatCurrency(spent)} spent
                  </p>
                )}
              </div>
              <button
                onClick={() => { setValue(limit || ''); setEditing(true); }}
                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl hover:bg-[#1a1a1a] text-[#444] hover:text-[#059669] transition-all touch-manipulation"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar states */}
      {limit > 0 && (
        <>
          <BurnBar pct={pct} color={status.color} />
          <div className="flex justify-between mt-1.5 text-[10px]">
            <span className="text-[#444]">{pct}% used</span>
            <span className={remaining < 0 ? 'text-[#ef4444] font-semibold' : 'text-[#555]'}>
              {remaining < 0
                ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over`
                : `₹${remaining.toLocaleString('en-IN')} left`}
            </span>
          </div>
        </>
      )}
      {!limit && hasData && (
        <div className="mt-1.5">
          <div className="h-1.5 w-full rounded-full border border-dashed border-[#2a2a2a] bg-[#1a1a1a]" />
          <p className="text-[10px] text-[#444] mt-1">No limit — tap ✏️ to set one</p>
        </div>
      )}
      {!limit && !hasData && (
        <div className="h-1.5 w-full rounded-full border border-dashed border-[#1e1e1e] mt-1" />
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Budget() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({});
  const qc = useQueryClient();
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.BUDGETS, dateRange.startDate, dateRange.endDate],
    queryFn:  () => budgetApi.get({ month, year, startDate: dateRange.startDate, endDate: dateRange.endDate }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => budgetApi.upsert(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.BUDGETS }); toast.success('Budget saved'); },
  });

  const handleCategoryLimit = (category, limit) => {
    const existing = data?.budget?.categories || [];
    const updated  = existing.filter((c) => c.category !== category);
    if (limit > 0) updated.push({ category, limit });
    saveMutation.mutate({
      month, year,
      totalBudget: updated.reduce((a, c) => a + c.limit, 0),
      categories:  updated,
    });
  };

  const handleCategoryNavigate = (categoryValue) => {
    const params = new URLSearchParams();
    params.set('category', categoryValue);
    params.set('type', 'expense');

    if (dateRange.timeRange === 'monthly' && dateRange.startDate) {
      const d = new Date(dateRange.startDate);
      params.set('timeRange', 'monthly');
      params.set('targetMonth', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    } else if (dateRange.timeRange === 'yearly' && dateRange.startDate) {
      const d = new Date(dateRange.startDate);
      params.set('timeRange', 'yearly');
      params.set('targetYear', String(d.getFullYear()));
    } else {
      params.set('timeRange', 'all');
    }
    navigate(`/expenses?${params.toString()}`);
  };

  const spendingMap      = data?.spendingMap || {};
  const budgetCategories = data?.budget?.categories || [];
  const getLimitForCat   = (v) => budgetCategories.find((c) => c.category === v)?.limit || 0;
  const totalBudget      = budgetCategories.reduce((a, c) => a + c.limit, 0);
  const totalSpent       = Object.values(spendingMap).reduce((a, v) => a + v, 0);
  const totalPct         = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overBudgetCats   = EXPENSE_CATEGORIES.filter((c) => {
    const lim = getLimitForCat(c.value);
    return lim > 0 && (spendingMap[c.value] || 0) > lim;
  });
  const overallStatus = getBurnStatus(totalPct);

  return (
    <PageLayout
      title="Budget"
      subtitle="Set limits, track burn rate"
    >
      {/* All content flows naturally inside PageLayout's scrollable main */}
      <div className="space-y-4">

        {/* Time range filter — inside content area, never touching the sticky header */}
        <TimeRangeFilter onChange={setDateRange} defaultRange="yearly" />

        {/* Overview cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total Budget', value: formatCurrency(totalBudget), sub: 'across all', color: 'text-[#3b82f6]' },
              { label: 'Total Spent',  value: formatCurrency(totalSpent),  sub: `${totalPct}% of budget`, color: totalPct > 80 ? 'text-[#ef4444]' : 'text-[#f59e0b]' },
              { label: 'Remaining',    value: formatCurrency(Math.max(0, totalBudget - totalSpent)), sub: totalBudget > 0 ? `${Math.max(0, 100 - totalPct)}% left` : 'Set a budget', color: 'text-[#059669]' },
              { label: 'Over Limit',   value: overBudgetCats.length, sub: overBudgetCats.length > 0 ? overBudgetCats.map(c => c.label).slice(0, 2).join(', ') : 'All clear 🎉', color: overBudgetCats.length > 0 ? 'text-[#ef4444]' : 'text-[#059669]' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-3.5"
              >
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1.5">{s.label}</p>
                <p className={cn('text-lg font-bold leading-tight', s.color)}>{s.value}</p>
                <p className="text-[10px] text-[#444] mt-0.5 truncate">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Overall burn bar */}
        {totalBudget > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-[#e0e0e0]">Overall Burn Rate</p>
                <p className="text-[10px] text-[#444] mt-0.5">{dateRange.label || 'selected period'}</p>
              </div>
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold', overallStatus.bg, overallStatus.textColor)}>
                <overallStatus.icon className="h-3.5 w-3.5" />
                {totalPct}%
              </div>
            </div>
            <BurnBar pct={totalPct} color={overallStatus.color} />
            <div className="flex justify-between mt-2 text-[10px] text-[#444]">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(totalBudget)} budget</span>
            </div>
          </motion.div>
        )}

        {/* Category grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" className="text-[#059669]" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider">
                Category Limits — {dateRange.label || 'selected period'}
              </p>
              <p className="text-[9px] text-[#333]">Tap ✏️ to edit</p>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {EXPENSE_CATEGORIES.filter((c) => c.value !== 'other').map((cat, i) => (
                <motion.div key={cat.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                  <CategoryBudgetRow
                    cat={cat}
                    limit={getLimitForCat(cat.value)}
                    spent={spendingMap[cat.value] || 0}
                    onSave={handleCategoryLimit}
                    onNavigate={handleCategoryNavigate}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
