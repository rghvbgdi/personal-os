import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Wallet, ChevronDown, ChevronUp,
  Filter, X,
} from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import MathInput from '@/components/ui/MathInput.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import TimeRangeFilter from '@/components/ui/TimeRangeFilter.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { CATEGORIES, CATEGORIES_BY_TYPE, PAYMENT_METHODS, QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency, formatDate } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const BG   = '#1C1917';
const SURF = '#282320';
const BORD = '#403C39';
const SURF2 = '#2D2926';

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
  expense:    { label: 'Expense',    activeClass: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/25',   prefix: '−', amountColor: 'text-[#ef4444]' },
  income:     { label: 'Income',     activeClass: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25',   prefix: '+', amountColor: 'text-[#22c55e]' },
  investment: { label: 'Invest',     activeClass: 'bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/25',  prefix: '→', amountColor: 'text-[#60a5fa]' },
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
      <div className="flex rounded-2xl border overflow-hidden" style={{ borderColor: BORD, background: SURF2 }}>
        {Object.entries(TYPE_CONFIG).map(([t, cfg]) => (
          <button
            key={t} type="button" onClick={() => handleTypeChange(t)}
            className={cn(
              'flex-1 py-3 text-xs font-bold transition-all duration-200 border-r last:border-r-0 min-h-[44px] select-none touch-manipulation',
              type === t ? cfg.activeClass : 'text-[#78716C] hover:text-[#A8A29E]',
            )}
            style={{ borderColor: BORD }}
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

      <div className="flex flex-col gap-3 p-3.5 rounded-2xl border" style={{ background: SURF2, borderColor: BORD }}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Sub-items</label>
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
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: BORD }}>
            <span className="text-xs text-[#78716C]">Auto-total:</span>
            <span className="text-xs font-bold text-[#F5EDE0]">{formatCurrency(subItemsSum)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3.5 rounded-2xl border" style={{ background: SURF2, borderColor: BORD }}>
        <label className="flex items-center gap-2.5 text-sm text-[#A8A29E] cursor-pointer min-h-[44px] touch-manipulation select-none">
          <input type="checkbox" className="accent-[#D97757] w-4 h-4 rounded" {...register('isRecurring')} />
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

// ── Transaction Card ──────────────────────────────────────────────────────────
function TransactionCard({ exp, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.value === exp.category);
  const cfg = TYPE_CONFIG[exp.type] || TYPE_CONFIG.expense;
  const hasSubItems = exp.subItems?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: SURF, border: `1px solid ${BORD}` }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: SURF2, border: `1px solid ${BORD}` }}>
          {cat?.icon || '📦'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F5EDE0] truncate leading-tight">{exp.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-[#78716C]">{formatDate(exp.date, 'MMM d')}</span>
            <span className="text-[#544F4C] text-[10px]">·</span>
            <span className="text-[10px] text-[#78716C]">{cat?.label || exp.category}</span>
            {exp.isRecurring && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#D97757]/10 text-[#D97757] font-bold">↺</span>
            )}
            {hasSubItems && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md text-[#78716C] hover:text-[#D97757] transition-colors touch-manipulation"
                style={{ background: SURF2, border: `1px solid ${BORD}` }}
              >
                {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                {exp.subItems.length} items
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={cn('text-sm font-bold', cfg.amountColor)}>
            {cfg.prefix}{formatCurrency(exp.amount)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(exp)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors touch-manipulation"
              style={{ background: SURF2 }}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(exp._id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors touch-manipulation"
              style={{ background: SURF2 }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasSubItems && (
          <motion.div key="subitems"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${BORD}` }}
          >
            <div className="px-4 py-2.5 space-y-2" style={{ background: SURF2 }}>
              {exp.subItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]/50" />
                    <span className="text-xs text-[#A8A29E]">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#F5EDE0]">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1.5" style={{ borderTop: `1px solid ${BORD}` }}>
                <span className="text-xs text-[#78716C]">Total</span>
                <span className="text-xs font-bold text-[#F5EDE0]">{formatCurrency(exp.amount)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Expenses() {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({});
  const qc = useQueryClient();

  const initCategory = searchParams.get('category') || '';
  const initType     = searchParams.get('type') || '';

  const [filterCategory, setFilterCategory] = useState(initCategory);
  const [filterType, setFilterType]         = useState(initType);

  const startDate = dateRange.startDate;
  const endDate   = dateRange.endDate;

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.EXPENSES, { search, filterCategory, filterType, page, startDate, endDate }],
    queryFn: () => expensesApi.getAll({
      search, category: filterCategory, type: filterType,
      startDate, endDate, page, limit: 20,
    }).then((r) => r.data),
    enabled: !!(startDate && endDate),
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
    <PageLayout>
      <div className="space-y-3 pb-6">

        {/* ── Page title row ── */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <h1 className="text-base font-semibold text-[#F5EDE0]">Expenses</h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white touch-manipulation transition-colors"
            style={{ background: '#D97757' }}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {/* ── Time range filter ── */}
        <TimeRangeFilter onChange={(range) => { setDateRange(range); setPage(1); }} defaultRange="monthly" />

        {/* ── Savings snapshot ── */}
        {totalIncome > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: SURF, border: `1px solid ${BORD}` }}
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Income</p>
                <p className="text-sm font-bold text-[#22c55e]">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Spent</p>
                <p className="text-sm font-bold text-[#ef4444]">{formatCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Saved</p>
                <p className={cn('text-sm font-bold', savings >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                </p>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: SURF2 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalIncome) * 100))}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#ef4444]"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#78716C]">
              <span>{Math.min(100, Math.round((totalExpense / totalIncome) * 100))}% used</span>
              <span className="text-[#22c55e] font-semibold">{savingsRate >= 0 ? savingsRate : 0}% saved</span>
            </div>
            {totalInvested > 0 && (
              <p className="text-[10px] text-[#78716C] mt-1.5">
                {formatCurrency(totalInvested)} invested ·{' '}
                <span className={cn('font-semibold', (savings - totalInvested) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {formatCurrency(savings - totalInvested)} net
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Search + Filter ── */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search…"
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl text-[#F5EDE0] placeholder:text-[#544F4C] focus:outline-none transition-colors min-h-[44px]"
              style={{ background: SURF, border: `1px solid ${BORD}` }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#F5EDE0] touch-manipulation"
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
                ? 'text-white'
                : 'text-[#78716C] hover:text-[#A8A29E]',
            )}
            style={{
              background: showFilters || activeFilterCount > 0 ? '#D97757' : SURF,
              borderColor: showFilters || activeFilterCount > 0 ? '#D97757' : BORD,
            }}
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
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-4 space-y-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <div>
                  <p className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider mb-2">Type</p>
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
                            ? 'text-[#D97757] border-[#D97757] bg-[#D97757]/10'
                            : 'text-[#78716C] hover:border-[#544F4C]',
                        )}
                        style={{ borderColor: filterType === opt.value ? '#D97757' : BORD }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider mb-2">Category</p>
                  <Select
                    options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))]}
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  />
                </div>

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
              <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background: SURF, border: `1px solid ${BORD}` }} />
            ))}
          </div>
        ) : !startDate ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-[#78716C]">Select a time period to view transactions</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <Wallet className="h-7 w-7 text-[#544F4C]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#78716C]">No transactions found</p>
              <p className="text-xs text-[#544F4C] mt-1">Tap Add to record your first entry</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold touch-manipulation"
              style={{ background: '#D97757' }}
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
              className="px-4 py-2 rounded-xl text-sm text-[#A8A29E] font-semibold disabled:opacity-30 touch-manipulation"
              style={{ background: SURF, border: `1px solid ${BORD}` }}
            >
              ← Prev
            </button>
            <span className="text-sm text-[#78716C] font-medium">{page} / {meta.pages}</span>
            <button
              disabled={page === meta.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl text-sm text-[#A8A29E] font-semibold disabled:opacity-30 touch-manipulation"
              style={{ background: SURF, border: `1px solid ${BORD}` }}
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
