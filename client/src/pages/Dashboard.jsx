import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { goalApi } from '@/api/index.js';
import TimeRangeFilter from '@/components/ui/TimeRangeFilter.jsx';
import { formatCurrency, formatDate, changePercent } from '@/utils/formatters.js';
import { CATEGORIES, QUERY_KEYS } from '@/constants/index.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { cn } from '@/utils/cn.js';

const now = new Date();

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: 'easeOut' } }),
};

function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'text-accent', index = 0 }) {
  const isPositive = trend > 0;
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible"
      className="relative rounded-2xl bg-surface border border-border p-4 overflow-hidden shadow-card group hover:shadow-elevated transition-shadow flex flex-col gap-2">
      {/* glow orb */}
      <div className={cn('absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity', color.replace('text-', 'bg-'))} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest leading-tight">{title}</span>
        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center bg-surface-2 border border-border flex-shrink-0', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn('text-xl font-bold leading-tight', color)}>{value}</p>
      {subtitle && <p className="text-[10px] text-text-secondary leading-tight">{subtitle}</p>}
      {trend !== undefined && trend !== null && (
        <div className={cn('flex items-center gap-1 text-[10px] font-medium', isPositive ? 'text-danger' : 'text-accent')}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      )}
    </motion.div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-elevated text-xs min-w-[130px]">
      <p className="text-text-muted font-semibold mb-2 pb-1 border-b border-border">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between items-center gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          </div>
          <span className="font-bold text-text-primary">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({});

  const periodLabel = dateRange.label || 'this period';

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: [...QUERY_KEYS.EXPENSE_DASHBOARD, dateRange.startDate, dateRange.endDate],
    queryFn: () => expensesApi.getDashboard({ startDate: dateRange.startDate, endDate: dateRange.endDate }).then((r) => r.data.data),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-range', dateRange.startDate, dateRange.endDate],
    queryFn: () => expensesApi.getAnalyticsRange({ startDate: dateRange.startDate, endDate: dateRange.endDate }).then((r) => r.data.data),
  });

  const { data: goalsData } = useQuery({
    queryKey: QUERY_KEYS.GOALS,
    queryFn: () => goalApi.getAll({ isCompleted: false }).then((r) => r.data.data),
  });

  // Derived numbers — use trendData summary for the selected range
  const totalExpense  = trendData?.summary?.find((s) => s._id === 'expense')?.total    || dashData?.currentMonth?.expense?.total    || 0;
  const totalIncome   = trendData?.summary?.find((s) => s._id === 'income')?.total     || dashData?.currentMonth?.income?.total     || 0;
  const totalInvested = trendData?.summary?.find((s) => s._id === 'investment')?.total || dashData?.currentMonth?.investment?.total || 0;
  const savings       = totalIncome - totalExpense;
  const netCashFlow   = totalIncome - totalExpense - totalInvested;
  const savingsRate   = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const lastExpenses = dashData?.lastMonth?.expense?.total || 0;
  const expenseTrend = changePercent(totalExpense, lastExpenses);

  const topCategories = (dashData?.topCategories || []).slice(0, 5).map((c) => {
    const cat = CATEGORIES.find((x) => x.value === c._id);
    return { name: cat?.label || c._id, value: c.total, color: cat?.color || '#6b7280' };
  });

  const chartData = useMemo(() => {
    if (!trendData?.trend) return [];
    const merged = {};
    trendData.trend.forEach((t) => {
      let label = t._id.period;
      if (label.length === 10) label = format(new Date(label + 'T12:00:00'), 'MMM d');
      else if (label.length === 7) label = format(new Date(label + '-01'), 'MMM');
      if (!merged[label]) merged[label] = { period: label, expense: 0, income: 0 };
      merged[label].expense += t._id.type === 'expense' ? t.total : 0;
      merged[label].income  += t._id.type === 'income'  ? t.total : 0;
    });
    return Object.values(merged);
  }, [trendData]);

  const xAxisProps = dateRange.timeRange === 'monthly'
    ? { tick: { fontSize: 9, fill: '#6b7280' }, angle: -45, textAnchor: 'end', height: 40, interval: 0 }
    : { tick: { fontSize: 10, fill: '#6b7280' }, interval: 'preserveStartEnd' };

  return (
    <PageLayout
      title={`Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || ''} 👋`}
      subtitle={format(now, 'EEEE, MMMM d')}
    >
      <div className="space-y-4">

        {/* ── Time range filter — top of content, full width on mobile ── */}
        <TimeRangeFilter onChange={setDateRange} defaultRange="monthly" />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {dashLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)
          ) : (
            <>
              <StatCard
                index={0}
                title="Total Spent"
                value={formatCurrency(totalExpense)}
                subtitle={periodLabel}
                trend={expenseTrend}
                icon={Wallet}
                color="text-danger"
              />
              <StatCard
                index={1}
                title="Income"
                value={formatCurrency(totalIncome)}
                subtitle={periodLabel}
                icon={TrendingUp}
                color="text-accent"
              />
              <StatCard
                index={2}
                title="Savings"
                value={formatCurrency(Math.max(0, savings))}
                subtitle={`${savingsRate >= 0 ? savingsRate : 0}% of income`}
                icon={PiggyBank}
                color={savings >= 0 ? 'text-accent' : 'text-danger'}
              />
              <StatCard
                index={3}
                title="Net Cash Flow"
                value={formatCurrency(netCashFlow)}
                subtitle={`Invested: ${formatCurrency(totalInvested)}`}
                icon={netCashFlow >= 0 ? TrendingUp : TrendingDown}
                color={netCashFlow >= 0 ? 'text-accent' : 'text-danger'}
              />
            </>
          )}
        </div>

        {/* ── Trend chart + Top categories (stacked on mobile) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl bg-surface border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Spending Overview</h3>
                <p className="text-xs text-text-muted mt-0.5">Income vs Expenses · {periodLabel}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Income</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" />Expense</span>
              </div>
            </div>
            {trendLoading ? (
              <div className="h-40 bg-surface-2 rounded-xl animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-text-muted text-sm">No data for {periodLabel}</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="incGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                  {/* Hide YAxis on mobile — saves ~40px horizontal space */}
                  <YAxis
                    className="hidden sm:block"
                    tick={{ fontSize: 10, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={0}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#059669" strokeWidth={1.5} fill="url(#incGrad2)" dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={1.5} fill="url(#expGrad2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Top categories pie */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl bg-surface border border-border p-4 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Top Spend Categories</h3>
            {topCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={topCategories} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {topCategories.map((_, i) => <Cell key={i} fill={topCategories[i].color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {topCategories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                        <span className="text-text-secondary truncate">{c.name}</span>
                      </div>
                      <span className="font-semibold text-text-primary">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-36 text-text-muted text-sm">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* ── Savings snapshot ── */}
        {!dashLoading && totalIncome > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-2xl bg-surface border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Savings Breakdown</h3>
                <p className="text-xs text-text-muted mt-0.5">{periodLabel}</p>
              </div>
              <span className={cn('text-lg font-bold', savings >= 0 ? 'text-accent' : 'text-danger')}>
                {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
              </span>
            </div>
            {/* Expense vs income bar */}
            <div className="h-3 rounded-full bg-surface-2 overflow-hidden mb-2">
              {totalIncome > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalIncome) * 100))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-danger"
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Spent {formatCurrency(totalExpense)} ({totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%)</span>
              <span>Saved {savingsRate >= 0 ? savingsRate : 0}%</span>
            </div>
            {totalInvested > 0 && (
              <p className="text-xs text-text-muted mt-1.5">
                + {formatCurrency(totalInvested)} invested · Net:{' '}
                <span className={cn('font-semibold', netCashFlow >= 0 ? 'text-accent' : 'text-danger')}>{formatCurrency(netCashFlow)}</span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Recent transactions ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-surface border border-border p-4 shadow-card">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Transactions</h3>
          {dashLoading ? <SkeletonTable rows={5} /> : (dashData?.recentExpenses?.length > 0) ? (
            <div className="space-y-1">
              {dashData.recentExpenses.map((exp) => {
                const cat = CATEGORIES.find((c) => c.value === exp.category);
                return (
                  <div key={exp._id} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-surface-2 transition-colors">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-surface-2 border border-border">
                      {cat?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{exp.title}</p>
                      <p className="text-xs text-text-muted">{formatDate(exp.date, 'MMM d, yyyy')} · {cat?.label || exp.category}</p>
                    </div>
                    <span className={cn('text-sm font-bold flex-shrink-0',
                      exp.type === 'income' ? 'text-accent' : exp.type === 'investment' ? 'text-info' : 'text-text-primary')}>
                      {exp.type === 'income' ? '+' : exp.type === 'investment' ? '→' : '−'}{formatCurrency(exp.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-sm">No transactions yet</div>
          )}
        </motion.div>

      </div>
    </PageLayout>
  );
}
