import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2, PieChart as PieIcon,
  Activity, Calendar, CalendarRange,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Card, { CardBody } from '@/components/ui/Card.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { CATEGORIES } from '@/constants/index.js';
import { formatCurrency } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';

// ─── Colour palette ──────────────────────────────────────────────────────────
const PIE_COLORS = [
  '#6366f1','#059669','#f59e0b','#ec4899','#3b82f6','#ef4444','#14b8a6','#f97316',
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────
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

// ─── Chart type toggle ────────────────────────────────────────────────────────
const CHART_TYPES = [
  { id: 'bar', icon: BarChart2, label: 'Bar' },
  { id: 'area', icon: Activity, label: 'Area' },
];

// ─── Time tabs (Year → Month) — Day removed (visible in Month bar chart already) ───────────────
const TIME_TABS = [
  { id: 'yearly',  icon: CalendarRange,  label: 'Year',  type: 'number', defaultFmt: () => String(new Date().getFullYear()) },
  { id: 'monthly', icon: Calendar,       label: 'Month', type: 'month',  defaultFmt: () => format(new Date(), 'yyyy-MM')    },
];

function buildRange(tab, value) {
  if (tab === 'monthly') {
    const [y, m] = value.split('-').map(Number);
    return {
      startDate: new Date(y, m - 1, 1).toISOString(),
      endDate:   new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
    };
  }
  // yearly
  const y = Number(value);
  return {
    startDate: new Date(y, 0, 1).toISOString(),
    endDate:   new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
  };
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      className="relative rounded-2xl bg-surface border border-border p-5 overflow-hidden shadow-card group hover:shadow-elevated transition-shadow"
    >
      {/* subtle glow orb */}
      <div className={cn('absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20', color.replace('text-', 'bg-'))} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-widest">{label}</p>
        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center bg-surface-2 border border-border', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState('yearly');
  const [tabValue, setTabValue] = useState(String(now.getFullYear()));
  const [chartType, setChartType] = useState('bar');

  const { startDate, endDate } = useMemo(() => buildRange(activeTab, tabValue), [activeTab, tabValue]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-range', startDate, endDate],
    queryFn: () =>
      expensesApi.getAnalyticsRange({ startDate, endDate }).then((r) => r.data.data),
  });

  // Build trend series with smart labels per granularity
  const trendData = useMemo(() => {
    if (!analytics?.trend) return [];
    const merged = {};
    analytics.trend.forEach((t) => {
      let label = t._id.period;
      if (label.length === 10) {
        // YYYY-MM-DD: monthly view daily points → "Jun 1", "Jun 2"...
        label = format(new Date(label + 'T12:00:00'), 'MMM d');
      } else if (label.length === 7) {
        // YYYY-MM: yearly view monthly points → "Jan", "Feb"...
        label = format(new Date(label + '-01'), 'MMM');
      }
      // YYYY (4 chars): all-time yearly points, keep as-is
      if (!merged[label]) merged[label] = { period: label, expense: 0, income: 0, investment: 0 };
      merged[label][t._id.type] = (merged[label][t._id.type] || 0) + t.total;
    });
    return Object.values(merged).map((r) => ({
      ...r,
      netCashFlow: r.income - r.expense - r.investment,
    }));
  }, [analytics]);

  const categoryData = useMemo(() =>
    (analytics?.categoryBreakdown || []).map((c, i) => {
      const cat = CATEGORIES.find((x) => x.value === c._id);
      return { name: cat?.label || c._id, value: c.total, color: PIE_COLORS[i % PIE_COLORS.length], count: c.count };
    }),
  [analytics]);

  const totalExpense  = analytics?.summary?.find((s) => s._id === 'expense')?.total    || 0;
  const totalIncome   = analytics?.summary?.find((s) => s._id === 'income')?.total     || 0;
  const totalInvested = analytics?.summary?.find((s) => s._id === 'investment')?.total || 0;
  const netCashFlow   = totalIncome - totalExpense - totalInvested;

  // savings rate
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'yearly')  setTabValue(String(now.getFullYear()));
    if (tabId === 'monthly') setTabValue(format(now, 'yyyy-MM'));
  };

  // For monthly view (30/31 days) we angle ticks to fit all without overlap
  const xAxisProps = activeTab === 'monthly'
    ? { tick: { fontSize: 9, fill: '#6b7280' }, angle: -45, textAnchor: 'end', height: 40, interval: 0 }
    : { tick: { fontSize: 11, fill: '#6b7280' }, interval: 'preserveStartEnd' };

  // Human-readable label for the selected period
  const periodLabel = activeTab === 'monthly'
    ? format(new Date(tabValue + '-01'), 'MMMM yyyy')
    : activeTab === 'yearly'
    ? `Year ${tabValue}`
    : tabValue;

  const STATS = [
    { label: 'Total Spent',   value: formatCurrency(totalExpense),  sub: `${analytics?.summary?.find(s=>s._id==='expense')?.count||0} transactions`, color: 'text-danger',  icon: Wallet },
    { label: 'Total Income',  value: formatCurrency(totalIncome),   sub: `${analytics?.summary?.find(s=>s._id==='income')?.count||0} entries`,      color: 'text-accent',  icon: TrendingUp },
    { label: 'Invested',      value: formatCurrency(totalInvested), sub: `${analytics?.summary?.find(s=>s._id==='investment')?.count||0} entries`,   color: 'text-info',    icon: TrendingDown },
    { label: 'Net Cash Flow', value: formatCurrency(netCashFlow),   sub: `${savingsRate >= 0 ? savingsRate : 0}% savings rate · ${periodLabel}`, color: netCashFlow >= 0 ? 'text-accent' : 'text-danger', icon: Activity },
  ];

  return (
    <PageLayout
      title="Analytics"
      subtitle="Deep dive into your spending patterns"
      actions={
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
            {CHART_TYPES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setChartType(id)}
                title={label}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  chartType === id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Time tab selector ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex rounded-xl border border-border overflow-hidden bg-surface-2 shadow-card">
            {TIME_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-r last:border-r-0 border-border',
                  activeTab === id
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {/* Date picker */}
          <div className="flex-1">
            {activeTab === 'monthly' && (
              <input
                type="month"
                value={tabValue}
                onChange={(e) => setTabValue(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            )}
            {activeTab === 'yearly' && (
              <input
                type="number"
                min="2000" max="2100"
                value={tabValue}
                onChange={(e) => setTabValue(e.target.value)}
                className="w-28 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>

        {/* ── Main trend chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="rounded-2xl bg-surface border border-border p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Income · Expense · Investment</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {activeTab === 'monthly' && format(new Date(tabValue + '-01'), 'MMMM yyyy')}
                {activeTab === 'yearly'  && `Year ${tabValue}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Income</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" />Expense</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" />Investment</span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-56 bg-surface-2 rounded-xl animate-pulse" />
          ) : trendData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2 text-text-muted">
              <BarChart2 className="h-10 w-10 opacity-20" />
              <p className="text-sm">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {chartType === 'bar' ? (
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="incBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="invBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 4 }} />
                  <Bar dataKey="income" name="Income" fill="url(#incBar)" radius={[6,6,0,0]} maxBarSize={22} />
                  <Bar dataKey="expense" name="Expense" fill="url(#expBar)" radius={[6,6,0,0]} maxBarSize={22} />
                  <Bar dataKey="investment" name="Investment" fill="url(#invBar)" radius={[6,6,0,0]} maxBarSize={22} />
                </BarChart>
              ) : (
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="invArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#059669" strokeWidth={2} fill="url(#incArea)" dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expArea)" dot={false} />
                  <Area type="monotone" dataKey="investment" name="Investment" stroke="#6366f1" strokeWidth={2} fill="url(#invArea)" dot={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Category breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="rounded-2xl bg-surface border border-border p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Category Breakdown</h3>
            </div>

            {isLoading ? (
              <div className="h-48 bg-surface-2 rounded-xl animate-pulse" />
            ) : categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={categoryData[i].color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {categoryData.slice(0, 6).map((c, i) => {
                    const pct = totalExpense > 0 ? Math.round((c.value / totalExpense) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                            <span className="text-text-secondary truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted">{pct}%</span>
                            <span className="font-semibold text-text-primary">{formatCurrency(c.value)}</span>
                          </div>
                        </div>
                        <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: c.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-muted">
                <PieIcon className="h-10 w-10 opacity-20" />
                <p className="text-sm">No expense data</p>
              </div>
            )}
          </motion.div>

          {/* Net Cash Flow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="rounded-2xl bg-surface border border-border p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Net Cash Flow</h3>
            </div>
            <p className="text-xs text-text-muted mb-4">Income − Expenses − Investments</p>

            {isLoading ? (
              <div className="h-48 bg-surface-2 rounded-xl animate-pulse" />
            ) : trendData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cashPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cashNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone" dataKey="netCashFlow" name="Net Cash Flow"
                      stroke={netCashFlow >= 0 ? '#059669' : '#ef4444'}
                      strokeWidth={2}
                      fill={netCashFlow >= 0 ? 'url(#cashPos)' : 'url(#cashNeg)'}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* big net number */}
                <div className={cn('mt-3 text-center text-2xl font-bold', netCashFlow >= 0 ? 'text-accent' : 'text-danger')}>
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                  <p className="text-xs font-normal text-text-muted mt-0.5">net for {periodLabel}</p>
                </div>
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-muted">
                <Activity className="h-10 w-10 opacity-20" />
                <p className="text-sm">No data for this period</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
