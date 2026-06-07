import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Wallet, ChevronDown, ChevronRight, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import MathInput from '@/components/ui/MathInput.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
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
    amount: z.coerce.number().positive('Must be > 0')
  })).optional().default([]),
});

const TYPE_CONFIG = {
  expense:    { label: 'Expense',    activeClass: 'bg-danger/10 text-danger border-danger/20',        prefix: '−' },
  income:     { label: 'Income',     activeClass: 'bg-accent-subtle text-accent border-accent-muted', prefix: '+' },
  investment: { label: 'Investment', activeClass: 'bg-info/10 text-info border-info/20',              prefix: '→' },
};

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

  const handleTypeChange = (newType) => {
    setValue('type', newType);
    setValue('category', '');
  };

  const currentSubItems = watch('subItems') || [];
  const subItemsSum = currentSubItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const hasSubItems = currentSubItems.length > 0;

  useEffect(() => {
    if (hasSubItems) {
      setValue('amount', subItemsSum, { shouldValidate: true });
    }
  }, [subItemsSum, hasSubItems, setValue]);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* 3-way type toggle */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        {Object.entries(TYPE_CONFIG).map(([t, cfg]) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold transition-all duration-150 border-r last:border-r-0 border-border',
              type === t ? cfg.activeClass : 'text-text-muted hover:text-text-secondary hover:bg-surface-2',
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <Input
        label="Title"
        placeholder={
          type === 'income' ? 'May salary, Freelance project...' :
          type === 'investment' ? 'Zerodha SIP, HDFC FD...' :
          'Coffee at Third Wave, Swiggy order...'
        }
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-2 gap-3">
        <MathInput
          label="Amount (₹)"
          placeholder="0.00"
          error={errors.amount?.message}
          disabled={hasSubItems}
          {...register('amount')}
        />
        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Category"
          options={availableCategories.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
          error={errors.category?.message}
          {...register('category')}
        />
        <Select
          label="Payment method"
          options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: `${p.icon} ${p.label}` }))}
          {...register('paymentMethod')}
        />
      </div>

      <Textarea label="Notes (optional)" placeholder="Optional notes..." rows={2} {...register('notes')} />

      <div className="flex flex-col gap-3 p-3 bg-surface-2 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-secondary">Sub-items (Optional Breakdown)</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: '', amount: '' })}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                placeholder="Item (e.g. Haircut)"
                {...register(`subItems.${index}.name`)}
                error={errors.subItems?.[index]?.name?.message}
              />
            </div>
            <div className="w-24">
              <MathInput
                placeholder="Amount"
                {...register(`subItems.${index}.amount`)}
                error={errors.subItems?.[index]?.amount?.message}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="mt-1 text-danger hover:bg-danger/10" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {fields.length > 0 && (
          <div className="flex items-center justify-between mt-1 pt-3 border-t border-border">
            <span className="text-xs font-medium text-text-secondary">Total automatically calculated:</span>
            <span className="text-xs font-bold text-text-primary">{formatCurrency(subItemsSum)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3 bg-surface-2 rounded-lg border border-border">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" className="accent-accent" {...register('isRecurring')} />
          Mark as recurring entry
        </label>

        {watch('isRecurring') && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Frequency"
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              error={errors.recurringFrequency?.message}
              {...register('recurringFrequency')}
            />
            <Input
              label="How many times?"
              type="number"
              min="1"
              placeholder="e.g. 3 (empty = forever)"
              error={errors.recurringOccurrences?.message}
              {...register('recurringOccurrences')}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Add'}</Button>
      </div>
    </form>
  );
}

function TypeBadge({ type }) {
  const cfg = {
    expense:    { label: 'Expense',    variant: 'default' },
    income:     { label: 'Income',     variant: 'success' },
    investment: { label: 'Investment', variant: 'info' },
  }[type] || { label: type, variant: 'default' };

  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/** Expandable row that shows sub-items when the badge is clicked */
function ExpenseRow({ exp, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.value === exp.category);
  const hasSubItems = exp.subItems?.length > 0;

  const amountColor = {
    income: 'text-accent', investment: 'text-info', expense: 'text-text-primary',
  }[exp.type] || 'text-text-primary';

  const amountPrefix = { income: '+', investment: '→', expense: '−' }[exp.type] || '';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid sm:grid-cols-[2fr_1fr_1fr_120px_80px] gap-4 px-4 py-3.5 items-center hover:bg-surface-2 transition-colors group"
      >
        {/* Title + type badge */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">{cat?.icon || '📦'}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{exp.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <TypeBadge type={exp.type} />
              {exp.isRecurring && <Badge variant="info" className="text-[10px]">Recurring</Badge>}
              {hasSubItems && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-surface-2 border border-border text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {expanded
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                  {exp.subItems.length} item{exp.subItems.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
          <span>{cat?.label || exp.category}</span>
        </div>

        {/* Date */}
        <div className="hidden sm:block text-sm text-text-secondary">
          {formatDate(exp.date, 'MMM d, yyyy')}
        </div>

        {/* Amount */}
        <div className={cn('text-sm font-bold text-right', amountColor)}>
          {amountPrefix}{formatCurrency(exp.amount)}
        </div>

        {/* Actions — always visible on mobile, hover-reveal on desktop */}
        <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(exp)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="hover:text-danger hover:bg-danger/5"
            onClick={() => onDelete(exp._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* Sub-items expandable panel */}
      <AnimatePresence>
        {expanded && hasSubItems && (
          <motion.div
            key="subitems"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 rounded-xl border border-border/60 bg-surface-2 divide-y divide-border/50">
              {exp.subItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60 flex-shrink-0" />
                    <span className="text-xs text-text-secondary">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2 bg-surface rounded-b-xl">
                <span className="text-xs font-medium text-text-muted">Total</span>
                <span className="text-xs font-bold text-text-primary">{formatCurrency(exp.amount)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Build a human-readable label for the selected time range */
function buildPeriodLabel(timeRange, targetMonth, targetYear) {
  if (timeRange === 'monthly') {
    const [y, m] = targetMonth.split('-').map(Number);
    return format(new Date(y, m - 1, 1), 'MMMM yyyy');
  }
  if (timeRange === 'yearly') return `Year ${targetYear}`;
  return 'All Time';
}

export default function Expenses() {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  // ── Read initial state from URL (set by Budget page navigation) ──────────────
  const initCategory = searchParams.get('category') || '';
  const initType     = searchParams.get('type')     || '';
  const initRange    = searchParams.get('timeRange') || 'monthly';
  const initMonth    = searchParams.get('targetMonth') || format(new Date(), 'yyyy-MM');
  const initYear     = searchParams.get('targetYear')  || new Date().getFullYear().toString();

  const [filterCategory, setFilterCategory] = useState(initCategory);
  const [filterType, setFilterType]         = useState(initType);
  const [timeRange, setTimeRange]           = useState(['monthly', 'yearly', 'all'].includes(initRange) ? initRange : 'monthly');
  const [targetMonth, setTargetMonth]       = useState(initMonth);
  const [targetYear, setTargetYear]         = useState(initYear);

  // ── Date bounds ───────────────────────────────────────────────────────────────
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

  // ── Main query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.EXPENSES, { search, filterCategory, filterType, page, timeRange, targetMonth, targetYear }],
    queryFn: () => expensesApi.getAll({
      search,
      category: filterCategory,
      type: filterType,
      startDate,
      endDate,
      page,
      limit: 20,
    }).then((r) => r.data),
  });

  // ── Savings query (expense + income totals for the period) ───────────────────
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

  const openAdd  = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const handleDelete = (id) => { if (confirm('Delete this entry?')) deleteMutation.mutate(id); };

  const expenses = data?.data || [];
  const meta     = data?.meta || {};

  return (
    <PageLayout
      title="Expenses"
      subtitle="Expenses · Income · Investments"
      actions={
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add entry
        </Button>
      }
    >
      <div className="space-y-4">

        {/* ── Savings snapshot (only when period has income data) ── */}
        {totalIncome > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-surface border border-border p-4 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Savings — {periodLabel}</p>
                  <p className="text-xs text-text-muted">Income minus expenses</p>
                </div>
              </div>
              <span className={cn('text-lg font-bold', savings >= 0 ? 'text-accent' : 'text-danger')}>
                {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalIncome) * 100))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-danger"
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Spent {formatCurrency(totalExpense)} ({totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%)</span>
              <span>Saved {formatCurrency(Math.max(0, savings))} ({savingsRate >= 0 ? savingsRate : 0}%)</span>
            </div>
            {totalInvested > 0 && (
              <p className="text-xs text-text-muted mt-1.5">
                + {formatCurrency(totalInvested)} invested ·{' '}
                Net: <span className={cn('font-semibold', (savings - totalInvested) >= 0 ? 'text-accent' : 'text-danger')}>
                  {formatCurrency(savings - totalInvested)}
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-52"
          />

          {/* Type filter pills */}
          <div className="flex gap-1">
            {[
              { value: '', label: 'All' },
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
              { value: 'investment', label: 'Investments' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFilterType(opt.value); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  filterType === opt.value
                    ? 'border-accent text-accent bg-accent-subtle'
                    : 'border-border text-text-muted hover:text-text-secondary hover:bg-surface-2',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Select
            options={CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
            placeholder="All categories"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="w-44"
          />

          {/* Time range — Month / Year / All only */}
          <div className="flex items-center gap-1">
            <div className="flex rounded-lg border border-border bg-surface-2 overflow-hidden">
              {[
                { value: 'monthly', label: 'Month' },
                { value: 'yearly',  label: 'Year'  },
                { value: 'all',     label: 'All'   },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setTimeRange(value); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold transition-all border-r last:border-r-0 border-border',
                    timeRange === value
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {timeRange === 'monthly' && (
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => { setTargetMonth(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            )}
            {timeRange === 'yearly' && (
              <input
                type="number"
                min="2000" max="2100"
                value={targetYear}
                onChange={(e) => { setTargetYear(e.target.value); setPage(1); }}
                className="w-20 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            )}
          </div>
        </div>

        {/* ── Period label ── */}
        {timeRange !== 'all' && (
          <p className="text-xs text-text-muted font-medium">
            Showing entries for <span className="text-text-secondary font-semibold">{periodLabel}</span>
            {filterCategory && (
              <> · category: <span className="text-text-secondary font-semibold">
                {CATEGORIES.find(c => c.value === filterCategory)?.label || filterCategory}
              </span></>
            )}
          </p>
        )}

        {/* ── Table ── */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_120px_80px] gap-4 px-4 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Entry</span>
            <span>Category</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={8} /></div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
              <Wallet className="h-10 w-10 opacity-20" />
              <p className="text-sm">No entries found</p>
              <Button variant="ghost" size="sm" onClick={openAdd}>Add your first entry</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {expenses.map((exp) => (
                <ExpenseRow
                  key={exp._id}
                  exp={exp}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-text-secondary">{page} / {meta.pages}</span>
            <Button variant="secondary" size="sm" disabled={page === meta.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Entry' : 'New Entry'}>
        <ExpenseForm defaultValues={editItem} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </PageLayout>
  );
}
