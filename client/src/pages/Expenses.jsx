import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Wallet, ChevronDown, ChevronUp,
  PiggyBank, Filter, X, TrendingUp, TrendingDown, ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import MathInput from '@/components/ui/MathInput.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { SkeletonTable } from '@/components/ui/Skeleton.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { CATEGORIES, CATEGORIES_BY_TYPE, PAYMENT_METHODS, QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency, formatDate } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  amount: z.coerce.number().positive('Must be > 0'),
  type: z.enum(['expense', 'income', 'investment']),
  category: z.string().min(1, 'Category required'),
  paymentMethod: z.string().default('upi'),
  date: z.string().min(1, 'Date required'),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().nullable().optional().transform(val => val === '' ? null : val),
  recurringOccurrences: z.any().transform(val => val ? Number(val) : null),
  subItems: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    amount: z.coerce.number().positive('Must be > 0'),
  })).optional().default([]),
});

const TYPE_CONFIG = {
  expense:    { label: 'Expense',    activeClass: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/25', prefix: '−', amountColor: 'text-[#ef4444]' },
  income:     { label: 'Income',     activeClass: 'bg-[#059669]/10 text-[#059669] border-[#059669]/25', prefix: '+', amountColor: 'text-[#059669]' },
  investment: { label: 'Invest',     activeClass: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/25', prefix: '→', amountColor: 'text-[#3b82f6]' },
};

// ── Expense Form ──────────────────────────────────────────────────────────────
function ExpenseForm({ defaultValues, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const isEdit = !!defaultValues?._id;

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? { ...defaultValues, date: format(new Date(defaultValues.date), 'yyyy-MM-dd'), subItems: defaultValues.subItems || [] }
      : { type: 'expense', paymentMethod: 'upi', date: format(new Date(), 'yyyy-MM-dd'), subItems: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'subItems' });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? expensesApi.update(defaultValues._id, data)
      : expensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSE_DASHBOARD });
      toast.success(isEdit ? 'Updated' : 'Added');
      onSuccess();
    },
  });

  const type = watch('type');
  const availableCategories = CATEGORIES_BY_TYPE[type] || CATEGORIES_BY_TYPE.expense;
  const currentSubItems = watch('subItems') || [];
  const subItemsSum = currentSubItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const hasSubItems = currentSubItems.length > 0;

  const handleTypeChange = (newType) => {
    setValue('type', newType);
    setValue('category', '');
  };

  useEffect(() => {
    if (hasSubItems) setValue('amount', subItemsSum, { shouldValidate: true });
  }, [subItemsSum, hasSubItems, setValue]);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-2xl border border-[#222] overflow-hidden bg-[#0d0d0d]">
        {Object.entries(TYPE_CONFIG).map(([t, cfg]) => (
          <button
            key={t} type="button" onClick={() => handleTypeChange(t)}
            className={cn(
              'flex-1 py-3 text-xs font-bold transition-all duration-200 border-r last:border-r-0 border-[#222] min-h-[44px] select-none touch-manipulation',
              type === t ? cfg.activeClass : 'text-[#555] hover:text-[#888]',
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <Input label="Title"
        placeholder={type === 'income' ? 'May salary…' : type === 'investment' ? 'Zerodha SIP…' : 'Coffee, Swiggy…'}
        error={errors.title?.message} {...register('title')}
      />

      <div className="grid grid-cols-2 gap-3">
        <MathInput label="Amount (₹)" placeholder="0.00" error={errors.amount?.message}
          disabled={hasSubItems} {...register('amount')}
        />
        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Category"
          options={availableCategories.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
          error={errors.category?.message} {...register('category')}
        />
        <Select label="Payment"
          options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: `${p.icon} ${p.label}` }))}
          {...register('paymentMethod')}
        />
      </div>

      <Textarea label="Notes (optional)" placeholder="Optional…" rows={2} {...register('notes')} />

      {/* Sub-items — collapsible */}
      <div className="flex flex-col gap-3 p-3.5 bg-[#0d0d0d] rounded-2xl border border-[#222]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#555] uppercase tracking-wider">Sub-items</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: '', amount: '' })}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Input placeholder="Item name" {...register(`subItems.${index}.name`)}
                error={errors.subItems?.[index]?.name?.message}
              />
            </div>
            <div className="w-24">
              <MathInput placeholder="₹" {...register(`subItems.${index}.amount`)}
                error={errors.subItems?.[index]?.amount?.message}
              />
            </div>
            <button type="button" onClick={() => remove(index)}
              className="mt-3 p-2 rounded-xl text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {fields.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-[#222]">
            <span className="text-xs text-[#555]">Auto-total:</span>
            <span className="text-xs font-bold text-[#ccc]">{formatCurrency(subItemsSum)}</span>
          </div>
        )}
      </div>

      {/* Recurring */}
      <div className="flex flex-col gap-3 p-3.5 bg-[#0d0d0d] rounded-2xl border border-[#222]">
        <label className="flex items-center gap-2.5 text-sm text-[#888] cursor-pointer min-h-[44px] touch-manipulation select-none">
          <input type="checkbox" className="accent-[#059669] w-4 h-4 rounded" {...register('isRecurring')} />
          <span className="font-medium">Recurring entry</span>
        </label>
        {watch('isRecurring') && (
          <div className="grid grid-cols-2 gap-3">
            <Select label="Frequency"
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              error={errors.recurringFrequency?.message}
              {...register('recurringFrequency')}
            />
            <Input label="Times (blank = forever)" type="number" min="1"
              error={errors.recurringOccurrences?.message}
              {...register('recurringOccurrences')}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}

// ── Transaction Card (iPhone 14 Pro optimised) ───────────────────────────────
function TransactionCard({ exp, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.value === exp.category);
  const cfg = TYPE_CONFIG[exp.type] || TYPE_CONFIG.expense;
  const hasSubItems = exp.subItems?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#111] border border-[#1e1e1e] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Category icon */}
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-[#1a1a1a] border border-[#252525]">
          {cat?.icon || '📦'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f0f0f0] truncate leading-tight">{exp.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-[#555]">{formatDate(exp.date, 'MMM d')}</span>
            <span className="text-[#333] text-[10px]">·</span>
            <span className="text-[10px] text-[#555]">{cat?.label || exp.category}</span>
            {exp.isRecurring && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#3b82f6]/10 text-[#3b82f6] font-bold">↺</span>
            )}
            {hasSubItems && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-[#1a1a1a] border border-[#252525] text-[#555] hover:text-[#059669] transition-colors touch-manipulation"
              >
                {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                {exp.subItems.length} items
              </button>
            )}
          </div>
        </div>

        {/* Amount + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={cn('text-sm font-bold', cfg.amountColor)}>
            {cfg.prefix}{formatCurrency(exp.amount)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(exp)}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-[#444] hover:text-[#059669] hover:bg-[#059669]/10 transition-colors touch-manipulation"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(exp._id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-[#444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors touch-manipulation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-items */}
      <AnimatePresence>
        {expanded && hasSubItems && (
          <motion.div key="subitems"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-[#1e1e1e]"
          >
            <div className="px-4 py-2.5 space-y-2 bg-[#0d0d0d]">
              {exp.subItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#059669]/50" />
                    <span className="text-xs text-[#888]">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#ccc]">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1.5 border-t border-[#1e1e1e]">
                <span className="text-xs text-[#555]">Total</span>
                <span className="text-xs font-bold text-[#f0f0f0]">{formatCurrency(exp.amount)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Period label helper ───────────────────────────────────────────────────────
function buildPeriodLabel(timeRange, targetMonth, targetYear) {
  if (timeRange === 'monthly') {
    const [y, m] = targetMonth.split('-').map(Number);
    return format(new Date(y, m - 1, 1), 'MMMM yyyy');
  }
  if (timeRange === 'yearly') return `Year ${targetYear}`;
  return 'All Time';
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Expenses() {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const initCategory = searchParams.get('category') || '';
  const initType     = searchParams.get('type') || '';
  const initRange    = searchParams.get('timeRange') || 'monthly';
  const initMonth    = searchParams.get('targetMonth') || format(new Date(), 'yyyy-MM');
  const initYear     = searchParams.get('targetYear') || new Date().getFullYear().toString();

  const [filterCategory, setFilterCategory] = useState(initCategory);
  const [filterType, setFilterType]         = useState(initType);
  const [timeRange, setTimeRange]           = useState(['monthly', 'yearly', 'all'].includes(initRange) ? initRange : 'monthly');
  const [targetMonth, setTargetMonth]       = useState(initMonth);
  const [targetYear, setTargetYear]         = useState(initYear);

  let startDate, endDate;
  if (timeRange === 'monthly') {
    const [y, m] = targetMonth.split('-').map(Number);
    startDate = new Date(y, m - 1, 1).toISOString();
    endDate   = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
  } else if (timeRange === 'yearly') {
    startDate = new Date(Number(targetYear), 0, 1).toISOString();
    endDate   = new Date(Number(targetYear), 11, 31, 23, 59, 59, 999).toISOString();
  }

  const periodLabel = buildPeriodLabel(timeRange, targetMonth, targetYear);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.EXPENSES, { search, filterCategory, filterType, page, timeRange, targetMonth, targetYear }],
    queryFn: () => expensesApi.getAll({
      search, category: filterCategory, type: filterType,
      startDate, endDate, page, limit: 20,
    }).then((r) => r.data),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-range', startDate, endDate],
    queryFn: () => expensesApi.getAnalyticsRange({ startDate, endDate }).then((r) => r.data.data),
    enabled: !!(startDate && endDate),
  });

  const totalIncome   = analyticsData?.summary?.find((s) => s._id === 'income')?.total     || 0;
  const totalExpense  = analyticsData?.summary?.find((s) => s._id === 'expense')?.total    || 0;
  const totalInvested = analyticsData?.summary?.find((s) => s._id === 'investment')?.total || 0;
  const savings       = totalIncome - totalExpense;
  const savingsRate   = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EXPENSE_DASHBOARD });
      toast.success('Deleted');
    },
  });

  const openAdd    = () => { setEditItem(null); setModalOpen(true); };
  const openEdit   = (item) => { setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const handleDelete = (id) => { if (confirm('Delete this entry?')) deleteMutation.mutate(id); };

  const expenses = data?.data || [];
  const meta     = data?.meta || {};
  const activeFilterCount = [filterType, filterCategory].filter(Boolean).length;

  return (
    <PageLayout
      title="Expenses"
      subtitle="Track income · expenses · investments"
      actions={
        <button
          onClick={openAdd}
          className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#059669] text-white hover:bg-[#048055] transition-colors touch-manipulation shadow-[0_0_12px_rgba(5,150,105,0.3)]"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div className="space-y-3">

        {/* ── Period filter strip ── */}
        <div className="flex gap-2">
          {[
            { value: 'monthly', label: 'Month' },
            { value: 'yearly',  label: 'Year'  },
            { value: 'all',     label: 'All'   },
          ].map(({ value, label }) => (
            <button key={value}
              onClick={() => { setTimeRange(value); setPage(1); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 touch-manipulation select-none',
                timeRange === value
                  ? 'bg-[#059669] text-white border-[#059669]'
                  : 'bg-[#111] text-[#555] border-[#1e1e1e] hover:border-[#333]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Month/Year sub-picker */}
        {timeRange === 'monthly' && (
          <input type="month" value={targetMonth}
            onChange={(e) => { setTargetMonth(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#222] bg-[#111] text-[#ccc] focus:outline-none focus:border-[#059669] transition-colors"
          />
        )}
        {timeRange === 'yearly' && (
          <input type="number" min="2000" max="2100" value={targetYear}
            onChange={(e) => { setTargetYear(e.target.value); setPage(1); }}
            className="w-24 px-3 py-2.5 text-sm rounded-xl border border-[#222] bg-[#111] text-[#ccc] focus:outline-none focus:border-[#059669] transition-colors"
          />
        )}

        {/* ── Savings snapshot ── */}
        {totalIncome > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4"
          >
            {/* 3-stat row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1">Income</p>
                <p className="text-sm font-bold text-[#059669]">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1">Spent</p>
                <p className="text-sm font-bold text-[#ef4444]">{formatCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1">Saved</p>
                <p className={cn('text-sm font-bold', savings >= 0 ? 'text-[#059669]' : 'text-[#ef4444]')}>
                  {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                </p>
              </div>
            </div>
            {/* Burn bar */}
            <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalIncome) * 100))}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#ef4444]"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#444]">
              <span>{Math.min(100, Math.round((totalExpense / totalIncome) * 100))}% used</span>
              <span className="text-[#059669] font-semibold">{savingsRate >= 0 ? savingsRate : 0}% saved</span>
            </div>
            {totalInvested > 0 && (
              <p className="text-[10px] text-[#444] mt-1.5">
                {formatCurrency(totalInvested)} invested ·{' '}
                <span className={cn('font-semibold', (savings - totalInvested) >= 0 ? 'text-[#059669]' : 'text-[#ef4444]')}>
                  {formatCurrency(savings - totalInvested)} net
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Search + Filter ── */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search…"
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-[#111] border border-[#1e1e1e] text-[#ccc] placeholder:text-[#444] focus:outline-none focus:border-[#059669] transition-colors min-h-[44px]"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#ccc] touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'relative flex items-center justify-center h-11 w-11 rounded-xl border transition-all flex-shrink-0 touch-manipulation',
              showFilters || activeFilterCount > 0
                ? 'bg-[#059669] border-[#059669] text-white'
                : 'bg-[#111] border-[#1e1e1e] text-[#444] hover:text-[#888]',
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4 space-y-4">
                {/* Type pills */}
                <div>
                  <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-2">Type</p>
                  <div className="flex gap-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'expense', label: 'Expense' },
                      { value: 'income', label: 'Income' },
                      { value: 'investment', label: 'Invest' },
                    ].map((opt) => (
                      <button key={opt.value}
                        onClick={() => { setFilterType(opt.value); setPage(1); }}
                        className={cn(
                          'flex-1 px-2 py-2 text-[10px] font-bold rounded-xl border transition-all touch-manipulation select-none',
                          filterType === opt.value
                            ? 'border-[#059669] text-[#059669] bg-[#059669]/10'
                            : 'border-[#1e1e1e] text-[#555] hover:border-[#333]',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-2">Category</p>
                  <Select
                    options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))]}
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  />
                </div>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterType(''); setFilterCategory(''); setPage(1); }}
                    className="text-xs text-[#ef4444] font-semibold touch-manipulation"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Transaction list ── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-2xl bg-[#111] border border-[#1e1e1e] animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center">
              <Wallet className="h-8 w-8 text-[#333]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#666]">No transactions found</p>
              <p className="text-xs text-[#444] mt-1">Tap + to add your first entry</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#059669] text-white text-sm font-bold touch-manipulation"
            >
              <Plus className="h-4 w-4" /> Add entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <TransactionCard key={exp._id} exp={exp} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2 pb-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl bg-[#111] border border-[#1e1e1e] text-sm text-[#888] font-semibold disabled:opacity-30 touch-manipulation"
            >
              ← Prev
            </button>
            <span className="text-sm text-[#555] font-medium">{page} / {meta.pages}</span>
            <button
              disabled={page === meta.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-[#111] border border-[#1e1e1e] text-sm text-[#888] font-semibold disabled:opacity-30 touch-manipulation"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Entry' : 'New Entry'}>
        <ExpenseForm defaultValues={editItem} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </PageLayout>
  );
}
