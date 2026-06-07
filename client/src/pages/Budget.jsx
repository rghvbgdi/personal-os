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
  if (pct >= 100) return { label: 'Over budget',  color: '#ef4444', textColor: 'text-danger',  bg: 'bg-danger/10',  icon: Flame };
  if (pct >= 80)  return { label: 'Almost there', color: '#f59e0b', textColor: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle };
  if (pct >= 50)  return { label: 'On track',     color: '#3b82f6', textColor: 'text-info',    bg: 'bg-info/10',    icon: TrendingDown };
  return             { label: 'Healthy',       color: '#059669', textColor: 'text-accent',  bg: 'bg-accent/10',  icon: ShieldCheck };
}

// ── Animated bar ────────────────────────────────────────────────────────────
function BurnBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="relative h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
      />
      {clamped >= 80 && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-y-0 rounded-full"
          style={{ left: `${Math.max(clamped - 8, 0)}%`, width: '8%', background: `${color}60`, filter: 'blur(3px)' }}
        />
      )}
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
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-2xl border bg-surface p-4 transition-all duration-200 hover:shadow-elevated',
        pct >= 100 ? 'border-danger/30' : pct >= 80 ? 'border-warning/30' : 'border-border hover:border-accent/30',
      )}
    >
      {/* Row: icon + name + status + edit/amount */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Category icon — clickable to drill into expenses */}
          <button
            onClick={() => onNavigate(cat.value)}
            title={`View ${cat.label} expenses`}
            className="text-2xl leading-none flex-shrink-0 hover:scale-110 transition-transform"
          >
            {cat.icon}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-text-primary truncate">{cat.label}</p>
              {hasData && (
                <button
                  onClick={() => onNavigate(cat.value)}
                  title="View expenses"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3 text-text-muted hover:text-accent" />
                </button>
              )}
            </div>
            {limit > 0 ? (
              <div className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold mt-0.5', status.bg, status.textColor)}>
                <StatusIcon className="h-2.5 w-2.5" />
                {status.label}
              </div>
            ) : hasData ? (
              <p className="text-[11px] text-text-muted mt-0.5">No limit set</p>
            ) : null}
          </div>
        </div>

        {/* Edit / Display */}
        <div className="flex-shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">₹</span>
                <input
                  autoFocus type="text" inputMode="decimal" value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => setValue(evaluateMath(String(value)))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                  className="w-28 pl-6 pr-2 py-1.5 text-sm bg-surface-2 border border-accent rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <button onClick={handleSave} className="p-1.5 rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <p className="text-sm font-bold text-text-primary">
                  {limit > 0 ? formatCurrency(limit) : <span className="text-text-muted font-normal text-xs">Not set</span>}
                </p>
                {hasData && (
                  <p className={cn('text-xs font-medium', pct >= 100 ? 'text-danger' : 'text-text-muted')}>
                    {formatCurrency(spent)} spent
                  </p>
                )}
              </div>
              <button
                onClick={() => { setValue(limit || ''); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-accent transition-all"
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
          <div className="flex justify-between mt-2 text-[11px]">
            <span className="text-text-muted">{pct}% used</span>
            <span className={remaining < 0 ? 'text-danger font-semibold' : 'text-text-secondary'}>
              {remaining < 0
                ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over`
                : `₹${remaining.toLocaleString('en-IN')} left`}
            </span>
          </div>
        </>
      )}
      {!limit && hasData && (
        <div className="mt-1">
          <div className="h-2 w-full rounded-full border border-dashed border-border bg-surface-2 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-warning/30" />
          </div>
          <p className="text-[11px] text-text-muted mt-1.5">No limit — tap ✏️ to set one</p>
        </div>
      )}
      {!limit && !hasData && (
        <div className="h-2 w-full rounded-full border border-dashed border-border/40 mt-1" />
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

  // Navigate to expenses with filters matching current budget page context
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
      // 'all' or unknown — show all time
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
      actions={<TimeRangeFilter onChange={setDateRange} defaultRange="monthly" />}
    >
      <div className="space-y-5">

        {/* Overview cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total budget', value: formatCurrency(totalBudget), sub: 'across categories', color: 'text-info', grad: 'from-info/10' },
              { label: 'Total spent',  value: formatCurrency(totalSpent),  sub: `${totalPct}% of budget`, color: totalPct > 80 ? 'text-danger' : 'text-warning', grad: 'from-warning/10' },
              { label: 'Remaining',    value: formatCurrency(Math.max(0, totalBudget - totalSpent)), sub: totalBudget > 0 ? `${Math.max(0, 100 - totalPct)}% left` : 'Set a budget', color: 'text-accent', grad: 'from-accent/10' },
              { label: 'Over limit',   value: overBudgetCats.length, sub: overBudgetCats.length > 0 ? overBudgetCats.map(c => c.label).slice(0, 2).join(', ') : 'All clear 🎉', color: overBudgetCats.length > 0 ? 'text-danger' : 'text-accent', grad: 'from-danger/10' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('rounded-2xl bg-gradient-to-br border border-border p-4 shadow-card', s.grad, 'to-surface')}>
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">{s.label}</p>
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-text-muted mt-0.5 truncate">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Overall burn bar */}
        {totalBudget > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-surface border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Overall Burn Rate</p>
                <p className="text-xs text-text-muted">Across all categories · {dateRange.label || 'selected period'}</p>
              </div>
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold', overallStatus.bg, overallStatus.textColor)}>
                <overallStatus.icon className="h-3.5 w-3.5" />
                {totalPct}%
              </div>
            </div>
            <BurnBar pct={totalPct} color={overallStatus.color} />
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(totalBudget)} budget</span>
            </div>
          </motion.div>
        )}

        {/* Category grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" className="text-accent" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Category Limits — {dateRange.label || 'selected period'}</p>
              <p className="text-xs text-text-muted">Hover to edit · Click icon to view expenses</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.filter((c) => c.value !== 'other').map((cat, i) => (
                <motion.div key={cat.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
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
