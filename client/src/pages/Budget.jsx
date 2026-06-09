import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pencil, Check, X, TrendingDown, AlertTriangle, ShieldCheck, Flame, ExternalLink, Lightbulb, PieChart as PieChartIcon } from 'lucide-react';
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
        'rounded-[24px] border bg-[#111] p-4 transition-all duration-200 shadow-sm',
        pct >= 100 ? 'border-[#ef4444]/30 bg-[#ef4444]/5' : pct >= 80 ? 'border-[#f59e0b]/25' : 'border-[#1e1e1e]',
      )}
    >
      {/* Row: icon + name + status + edit/amount */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Category icon */}
          <button
            onClick={() => onNavigate(cat.value)}
            className="w-12 h-12 rounded-[18px] bg-black border border-white/5 flex items-center justify-center flex-shrink-0 touch-manipulation shadow-inner"
          >
            <span className="text-xl leading-none">{cat.icon}</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-bold text-white truncate">{cat.label}</p>
              {hasData && (
                <button
                  onClick={() => onNavigate(cat.value)}
                  className="touch-manipulation opacity-50 hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-white" />
                </button>
              )}
            </div>
            {limit > 0 ? (
              <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black mt-1 uppercase tracking-widest', status.bg, status.textColor)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </div>
            ) : hasData ? (
              <p className="text-[11px] font-medium text-[#666] mt-1">No limit set</p>
            ) : null}
          </div>
        </div>

        {/* Edit / Display */}
        <div className="flex-shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666] font-medium">₹</span>
                <input
                  autoFocus type="text" inputMode="decimal" value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => setValue(evaluateMath(String(value)))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                  className="w-32 pl-7 pr-3 py-2 text-[15px] font-bold bg-black border-2 border-[#059669] rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-[#059669]/20"
                />
              </div>
              <button onClick={handleSave} className="p-2 rounded-xl bg-[#059669] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[#059669]/20 touch-manipulation">
                <Check className="h-4 w-4" strokeWidth={3} />
              </button>
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl bg-black border border-[#333] text-[#888] hover:text-white transition-colors touch-manipulation">
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <div className="text-right">
                <p className="text-[15px] font-black text-white">
                  {limit > 0 ? formatCurrency(limit) : <span className="text-[#555] font-semibold text-xs">Set limit</span>}
                </p>
                {hasData && (
                  <p className={cn('text-[11px] font-bold tracking-tight', pct >= 100 ? 'text-[#ef4444]' : 'text-[#666]')}>
                    {formatCurrency(spent)} spent
                  </p>
                )}
              </div>
              <button
                onClick={() => { setValue(limit || ''); setEditing(true); }}
                className="p-2.5 rounded-[14px] bg-black border border-[#222] text-[#666] hover:text-[#059669] hover:border-[#059669]/30 transition-all touch-manipulation shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar states */}
      {limit > 0 && (
        <div className="mt-2 px-1">
          <BurnBar pct={pct} color={status.color} />
          <div className="flex justify-between mt-2 text-[11px] font-semibold">
            <span className="text-[#666]">{pct}% used</span>
            <span className={remaining < 0 ? 'text-[#ef4444]' : 'text-[#888]'}>
              {remaining < 0
                ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over`
                : `₹${remaining.toLocaleString('en-IN')} left`}
            </span>
          </div>
        </div>
      )}
      {!limit && hasData && (
        <div className="mt-2 px-1">
          <div className="h-2 w-full rounded-full border border-dashed border-[#333] bg-black" />
          <p className="text-[11px] font-semibold text-[#666] mt-2">Uncapped spending — tap ✏️ to limit</p>
        </div>
      )}
      {!limit && !hasData && (
        <div className="px-1">
          <div className="h-2 w-full rounded-full border border-dashed border-[#222] mt-2" />
        </div>
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

  // Calculate Insights
  const nearingLimitCats = EXPENSE_CATEGORIES.map(c => {
    const lim = getLimitForCat(c.value);
    const spent = spendingMap[c.value] || 0;
    const pct = lim > 0 ? Math.round((spent / lim) * 100) : 0;
    return { ...c, pct, lim, spent };
  }).filter(c => c.pct >= 75 && c.pct < 100).sort((a, b) => b.pct - a.pct);

  const topSpendingCats = EXPENSE_CATEGORIES.map(c => ({
    ...c, spent: spendingMap[c.value] || 0
  })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 3);

  const overallStatus = getBurnStatus(totalPct);

  return (
    <PageLayout
      title="Budget"
      subtitle="Set limits, track burn rate"
    >
      <div className="flex-1 flex flex-col space-y-5 pb-6">

        {/* Time range filter */}
        <TimeRangeFilter onChange={setDateRange} defaultRange="yearly" />

        {/* Overview cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Budget', value: formatCurrency(totalBudget), sub: 'across all', color: 'text-[#3b82f6]' },
              { label: 'Total Spent',  value: formatCurrency(totalSpent),  sub: `${totalPct}% of budget`, color: totalPct > 80 ? 'text-[#ef4444]' : 'text-[#f59e0b]' },
              { label: 'Remaining',    value: formatCurrency(Math.max(0, totalBudget - totalSpent)), sub: totalBudget > 0 ? `${Math.max(0, 100 - totalPct)}% left` : 'Set a budget', color: 'text-[#059669]' },
              { label: 'Over Limit',   value: overBudgetCats.length, sub: overBudgetCats.length > 0 ? overBudgetCats.map(c => c.label).slice(0, 2).join(', ') : 'All clear 🎉', color: overBudgetCats.length > 0 ? 'text-[#ef4444]' : 'text-[#059669]' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-[24px] bg-[#111] border border-[#1e1e1e] p-5 shadow-sm"
              >
                <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-2">{s.label}</p>
                <p className={cn('text-xl font-black leading-none mb-1', s.color)}>{s.value}</p>
                <p className="text-[11px] font-semibold text-[#666] truncate">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Overall burn bar */}
        {totalBudget > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-[24px] bg-[#111] border border-[#1e1e1e] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[15px] font-bold text-white">Overall Burn Rate</p>
                <p className="text-[11px] font-semibold text-[#666] mt-0.5 uppercase tracking-widest">{dateRange.label || 'selected period'}</p>
              </div>
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-black shadow-inner border border-black/10', overallStatus.bg, overallStatus.textColor)}>
                <overallStatus.icon className="h-4 w-4" />
                {totalPct}%
              </div>
            </div>
            <BurnBar pct={totalPct} color={overallStatus.color} />
            <div className="flex justify-between mt-3 text-xs font-bold text-[#777]">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(totalBudget)} budget</span>
            </div>
          </motion.div>
        )}

        {/* Main Content Area - Expands to push everything nicely */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Spinner size="lg" className="text-[#059669]" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-6">
            
            {/* Actionable Insights Section to Fill Empty Space */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-[#666] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                <Lightbulb size={12} className="text-[#f59e0b]" /> Budget Insights
              </p>
              
              <div className="grid gap-3">
                {/* Insight 1: Near Limits */}
                {nearingLimitCats.length > 0 ? (
                  <div className="rounded-[20px] bg-gradient-to-br from-[#f59e0b]/10 to-transparent border border-[#f59e0b]/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#f59e0b]/20 text-[#f59e0b]">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white mb-1">Nearing Limits</p>
                        <p className="text-[11px] text-[#aaa] font-medium leading-relaxed">
                          You are at <strong>{nearingLimitCats[0].pct}%</strong> of your {nearingLimitCats[0].label} budget. Slow down spending to stay on track.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[20px] bg-gradient-to-br from-[#059669]/10 to-transparent border border-[#059669]/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#059669]/20 text-[#059669]">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white mb-1">Looking Good</p>
                        <p className="text-[11px] text-[#aaa] font-medium leading-relaxed">
                          None of your active budgets are close to exceeding their limits. Great job tracking!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insight 2: Top Spenders */}
                {topSpendingCats.length > 0 && (
                  <div className="rounded-[20px] bg-[#111] border border-[#1e1e1e] p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-black border border-[#222] text-[#3b82f6]">
                        <PieChartIcon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-white mb-2">Top Spenders</p>
                        <div className="space-y-2">
                          {topSpendingCats.map((cat, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] font-semibold">
                              <span className="text-[#888] flex items-center gap-1.5"><span className="text-[10px]">{cat.icon}</span> {cat.label}</span>
                              <span className="text-white">{formatCurrency(cat.spent)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Limits List */}
            <div className="flex-1 space-y-3 pb-8">
              <div className="flex items-center justify-between px-1 mb-1 mt-4">
                <p className="text-[11px] font-black text-[#666] uppercase tracking-[0.15em]">
                  Category Limits
                </p>
                <p className="text-[10px] font-bold text-[#555] bg-[#111] px-2 py-1 rounded-md">Tap ✏️ to edit</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
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
            </div>

          </div>
        )}
      </div>
    </PageLayout>
  );
}
