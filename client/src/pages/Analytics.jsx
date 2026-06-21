import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2, PieChart as PieIcon,
  Activity,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import TimeRangeFilter from '@/components/ui/TimeRangeFilter.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { CATEGORIES } from '@/constants/index.js';
import { formatCurrency } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';

const SURF = '#282320';
const BORD = '#403C39';

const PIE_COLORS = [
  '#ef4444','#f59e0b','#D97757','#60a5fa','#a78bfa','#34d399','#f472b6','#fb923c',
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-elevated text-xs min-w-[130px]"
      style={{ background: SURF, border: `1px solid ${BORD}` }}>
      <p className="text-[#78716C] font-semibold mb-2 pb-1" style={{ borderBottom: `1px solid ${BORD}` }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between items-center gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          </div>
          <span className="font-bold text-[#F5EDE0]">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CHART_TYPES = [
  { id: 'bar',  label: 'Bar'  },
  { id: 'area', label: 'Area' },
];

function StatCard({ label, value, sub, color, icon: Icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{ background: SURF, border: `1px solid ${BORD}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-medium text-[#78716C] uppercase tracking-widest">{label}</p>
        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', color)}
          style={{ background: '#312D2A', border: `1px solid ${BORD}` }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-[#78716C] mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState({});
  const [chartType, setChartType] = useState('bar');

  const startDate = dateRange.startDate;
  const endDate   = dateRange.endDate;
  const periodLabel = dateRange.label || '';

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-range', startDate, endDate],
    queryFn: () => expensesApi.getAnalyticsRange({ startDate, endDate }).then((r) => r.data.data),
    enabled: !!(startDate && endDate),
  });

  const trendData = useMemo(() => {
    if (!analytics?.trend) return [];
    const merged = {};
    analytics.trend.forEach((t) => {
      let label = t._id.period;
      if (label.length === 10) label = format(new Date(label + 'T12:00:00'), 'MMM d');
      else if (label.length === 7) label = format(new Date(label + '-01'), 'MMM');
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
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const xAxisProps = dateRange.timeRange === 'monthly'
    ? { tick: { fontSize: 9, fill: '#78716C' }, angle: -45, textAnchor: 'end', height: 40, interval: 0 }
    : { tick: { fontSize: 11, fill: '#78716C' }, interval: 'preserveStartEnd' };

  const STATS = [
    { label: 'Total Spent',   value: formatCurrency(totalExpense),  sub: `${analytics?.summary?.find(s=>s._id==='expense')?.count||0} transactions`, color: 'text-danger',  icon: Wallet },
    { label: 'Total Income',  value: formatCurrency(totalIncome),   sub: `${analytics?.summary?.find(s=>s._id==='income')?.count||0} entries`,      color: 'text-[#22c55e]',  icon: TrendingUp },
    { label: 'Invested',      value: formatCurrency(totalInvested), sub: `${analytics?.summary?.find(s=>s._id==='investment')?.count||0} entries`,   color: 'text-info',    icon: TrendingDown },
    { label: 'Net Cash Flow', value: formatCurrency(netCashFlow),   sub: `${savingsRate >= 0 ? savingsRate : 0}% savings rate · ${periodLabel}`,    color: netCashFlow >= 0 ? 'text-accent' : 'text-danger', icon: Activity },
  ];

  return (
    <PageLayout>
      <div className="space-y-5 pb-6">

        {/* ── Page title + chart type toggle ── */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-base font-semibold text-[#F5EDE0]">Analytics</h1>
          <div className="flex items-center rounded-xl p-0.5" style={{ background: '#312D2A', border: `1px solid ${BORD}` }}>
            {CHART_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setChartType(id)}
                className={cn(
                  'px-3 py-1.5 rounded-[9px] text-[11px] font-semibold transition-all touch-manipulation',
                  chartType === id ? 'bg-accent text-white' : 'text-[#78716C] hover:text-[#A8A29E]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Time range filter ── */}
        <TimeRangeFilter onChange={setDateRange} defaultRange="yearly" />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>

        {/* ── Main trend chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: SURF, border: `1px solid ${BORD}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#F5EDE0]">Income · Expense · Investment</h3>
              <p className="text-xs text-[#78716C] mt-0.5">{periodLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#78716C]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Income</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Expense</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#60a5fa]" />Invest</span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-56 rounded-xl animate-pulse" style={{ background: '#312D2A' }} />
          ) : trendData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2 text-[#78716C]">
              <BarChart2 className="h-10 w-10 opacity-20" />
              <p className="text-sm">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {chartType === 'bar' ? (
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="incBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="invBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(217,119,87,0.05)', radius: 4 }} />
                  <Bar dataKey="income" name="Income" fill="url(#incBar)" radius={[6,6,0,0]} maxBarSize={22} />

                  <Bar dataKey="expense" name="Expense" fill="url(#expBar)" radius={[6,6,0,0]} maxBarSize={22} />
                  <Bar dataKey="investment" name="Investment" fill="url(#invBar)" radius={[6,6,0,0]} maxBarSize={22} />
                </BarChart>
              ) : (
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="invArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fill="url(#incArea)" dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expArea)" dot={false} />
                  <Area type="monotone" dataKey="investment" name="Investment" stroke="#60a5fa" strokeWidth={2} fill="url(#invArea)" dot={false} />
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
            transition={{ delay: 0.3, duration: 0.3 }}
            className="rounded-2xl p-5"
            style={{ background: SURF, border: `1px solid ${BORD}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="h-4 w-4 text-[#78716C]" />
              <h3 className="text-sm font-semibold text-[#F5EDE0]">Category Breakdown</h3>
            </div>

            {isLoading ? (
              <div className="h-48 rounded-xl animate-pulse" style={{ background: '#312D2A' }} />
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
                            <span className="text-[#A8A29E] truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#78716C]">{pct}%</span>
                            <span className="font-semibold text-[#F5EDE0]">{formatCurrency(c.value)}</span>
                          </div>
                        </div>
                        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: '#312D2A' }}>
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
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-[#78716C]">
                <PieIcon className="h-10 w-10 opacity-20" />
                <p className="text-sm">No expense data</p>
              </div>
            )}
          </motion.div>

          {/* Net Cash Flow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="rounded-2xl p-5"
            style={{ background: SURF, border: `1px solid ${BORD}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-[#78716C]" />
              <h3 className="text-sm font-semibold text-[#F5EDE0]">Net Cash Flow</h3>
            </div>
            <p className="text-xs text-[#78716C] mb-4">Income − Expenses − Investments</p>

            {isLoading ? (
              <div className="h-48 rounded-xl animate-pulse" style={{ background: '#312D2A' }} />
            ) : trendData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cashPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97757" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D97757" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cashNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" {...xAxisProps} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone" dataKey="netCashFlow" name="Net Cash Flow"
                      stroke={netCashFlow >= 0 ? '#D97757' : '#ef4444'}
                      strokeWidth={2}
                      fill={netCashFlow >= 0 ? 'url(#cashPos)' : 'url(#cashNeg)'}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className={cn('mt-3 text-center text-2xl font-bold', netCashFlow >= 0 ? 'text-accent' : 'text-danger')}>
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                  <p className="text-xs font-normal text-[#78716C] mt-0.5">net for {periodLabel}</p>
                </div>
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-[#78716C]">
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
