import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import { budgetApi } from '@/api/index.js';
import { EXPENSE_CATEGORIES, QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency } from '@/utils/formatters.js';
import { evaluateMath } from '@/components/ui/MathInput.jsx';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

function BurnBar({ pct, over }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#D97757' }}
      />
    </div>
  );
}

function EditableAmount({ value, onSave, placeholder = 'Set limit' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  const commit = () => {
    const v = parseFloat(evaluateMath(String(draft)));
    if (!isNaN(v) && v >= 0) onSave(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">₹</span>
          <input
            autoFocus type="text" inputMode="decimal" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="w-32 pl-7 pr-2 py-1.5 text-sm font-semibold bg-surface border-2 border-accent rounded-xl text-text-primary focus:outline-none"
          />
        </div>
        <button onClick={commit} className="p-1.5 rounded-lg bg-accent text-white touch-manipulation">
          <Check size={13} strokeWidth={2.5} />
        </button>
        <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-surface-2 text-text-muted touch-manipulation">
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value || ''); setEditing(true); }}
      className="flex items-center gap-1.5 group touch-manipulation"
    >
      <span className={cn('text-sm font-semibold', value > 0 ? 'text-text-primary' : 'text-text-muted')}>
        {value > 0 ? formatCurrency(value) : placeholder}
      </span>
      <Pencil size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function CategoryRow({ cat, limit, spent, onSave, onNavigate }) {
  const pct       = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const over      = limit > 0 && spent > limit;
  const remaining = (limit || 0) - spent;

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3 mb-2.5">
        <button
          onClick={() => spent > 0 && onNavigate(cat.value)}
          className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 text-base touch-manipulation"
        >
          {cat.icon}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{cat.label}</p>
          <p className="text-[11px] text-text-muted">{formatCurrency(spent)} spent</p>
        </div>
        <EditableAmount value={limit} onSave={(v) => onSave(cat.value, v)} />
      </div>
      {limit > 0 && (
        <div>
          <BurnBar pct={pct} over={over} />
          <div className="flex justify-between mt-1.5 text-[10px] font-medium text-text-muted">
            <span>{pct}%</span>
            <span className={over ? 'text-danger font-semibold' : ''}>
              {over ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Budget() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const now = new Date();

  const [mode, setMode]   = useState('year');
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const apiMonth = mode === 'year' ? 0 : month;

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.BUDGETS, apiMonth, year],
    queryFn: () => budgetApi.get({ month: apiMonth, year }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => budgetApi.upsert(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.BUDGETS }),
    onError: () => toast.error('Failed to save'),
  });

  const handleTotalBudget = (v) => {
    saveMutation.mutate({ month: apiMonth, year, totalBudget: v, categories: data?.budget?.categories || [] });
  };

  const handleCategoryLimit = (category, limit) => {
    const existing = data?.budget?.categories || [];
    const updated  = existing.filter((c) => c.category !== category);
    if (limit > 0) updated.push({ category, limit });
    saveMutation.mutate({ month: apiMonth, year, totalBudget: data?.budget?.totalBudget || 0, categories: updated });
  };

  const handleCategoryNavigate = (categoryValue) => {
    const params = new URLSearchParams();
    params.set('category', categoryValue);
    params.set('type', 'expense');
    if (mode === 'month') {
      params.set('timeRange', 'monthly');
      params.set('targetMonth', `${year}-${String(month).padStart(2, '0')}`);
    } else {
      params.set('timeRange', 'yearly');
      params.set('targetYear', String(year));
    }
    navigate(`/expenses?${params.toString()}`);
  };

  const spendingMap = data?.spendingMap || {};
  const budgetCats  = data?.budget?.categories || [];
  const totalBudget = data?.budget?.totalBudget || 0;
  const totalSpent  = Object.values(spendingMap).reduce((a, v) => a + v, 0);
  const totalPct    = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overBudget  = totalBudget > 0 && totalSpent > totalBudget;
  const getLimitForCat = (v) => budgetCats.find((c) => c.category === v)?.limit || 0;

  const prevPeriod = () => {
    if (mode === 'year') { setYear((y) => y - 1); return; }
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextPeriod = () => {
    if (mode === 'year') { setYear((y) => y + 1); return; }
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const periodLabel = mode === 'year'
    ? String(year)
    : format(new Date(year, month - 1, 1), 'MMM yyyy');

  return (
    <PageLayout>
      <div className="space-y-5 pb-8">

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface-2 p-0.5">
            {[{ v: 'year', l: 'Year' }, { v: 'month', l: 'Month' }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={cn(
                  'px-4 py-1.5 rounded-[9px] text-[11px] font-semibold transition-all touch-manipulation select-none',
                  mode === v ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 ml-auto">
            <button onClick={prevPeriod} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors touch-manipulation">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-semibold text-text-primary w-[80px] text-center select-none">{periodLabel}</span>
            <button onClick={nextPeriod} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors touch-manipulation">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Total budget card */}
        <div className="rounded-2xl bg-surface border border-border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1.5">
                Total Budget · {periodLabel}
              </p>
              <EditableAmount value={totalBudget} onSave={handleTotalBudget} placeholder="Set total budget" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1.5">Spent</p>
              <p className={cn('text-sm font-bold', overBudget ? 'text-danger' : 'text-text-primary')}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
          {totalBudget > 0 && (
            <>
              <BurnBar pct={totalPct} over={overBudget} />
              <div className="flex justify-between mt-2 text-[11px] text-text-muted font-medium">
                <span>{totalPct}% used</span>
                <span className={overBudget ? 'text-danger font-semibold' : 'text-accent font-semibold'}>
                  {overBudget
                    ? `${formatCurrency(totalSpent - totalBudget)} over`
                    : `${formatCurrency(totalBudget - totalSpent)} remaining`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Category limits */}
        <div className="rounded-2xl bg-surface border border-border px-5">
          <div className="pt-4 pb-2 flex items-center justify-between border-b border-border">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Category Limits</p>
            <p className="text-[10px] text-text-muted">Tap amount to edit</p>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading…</div>
          ) : (
            EXPENSE_CATEGORIES.filter((c) => c.value !== 'other').map((cat) => (
              <CategoryRow
                key={cat.value}
                cat={cat}
                limit={getLimitForCat(cat.value)}
                spent={spendingMap[cat.value] || 0}
                onSave={handleCategoryLimit}
                onNavigate={handleCategoryNavigate}
              />
            ))
          )}
        </div>

      </div>
    </PageLayout>
  );
}
