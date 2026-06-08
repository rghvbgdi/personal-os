/**
 * Home.jsx — Segment Selector (Command Center)
 *
 * Full-screen 2×2 card grid shown on first open.
 * Remembers last-visited segment in localStorage.
 * Each card shows a live stat fetched in parallel.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Wallet, CheckSquare, Code2, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { taskApi, placementApi } from '@/api/index.js';
import { ROUTES, QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';

const LAST_SEGMENT_KEY = 'personal-os:last-segment';

// ── Segment definitions ────────────────────────────────────────────────────────
const SEGMENTS = [
  {
    id: 'expense',
    icon: Wallet,
    emoji: '💸',
    title: 'Expense Tracker',
    subtitle: 'Track every rupee',
    route: ROUTES.DASHBOARD,
    accent: '#22c55e',
  },
  {
    id: 'todo',
    icon: CheckSquare,
    emoji: '✅',
    title: 'Todo & Work',
    subtitle: 'Stay on top',
    route: ROUTES.TODO_TODAY,
    accent: '#6c63ff',
  },
  {
    id: 'placement',
    icon: Code2,
    emoji: '🎯',
    title: 'Placement',
    subtitle: 'DSA · System Design · Prep',
    route: ROUTES.PLACEMENT,
    accent: '#f59e0b',
  },
  {
    id: 'overview',
    icon: LayoutDashboard,
    emoji: '📊',
    title: 'Dashboard',
    subtitle: 'Your life at a glance',
    route: ROUTES.DASHBOARD,
    accent: '#3b82f6',
  },
];

// ── Live stat hooks (fetched in parallel, shown on each card) ──────────────────
function useLiveStats() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDate   = now.toISOString();

  const { data: dashData } = useQuery({
    queryKey: [...QUERY_KEYS.EXPENSE_DASHBOARD, startDate, endDate],
    queryFn: () => expensesApi.getDashboard({ startDate, endDate }).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: tasksData } = useQuery({
    queryKey: QUERY_KEYS.TASKS_TODAY,
    queryFn: () => taskApi.getToday().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: placementData } = useQuery({
    queryKey: QUERY_KEYS.PLACEMENT_STATS,
    queryFn: () => placementApi.getStats().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

  const monthlyExpense = dashData?.currentMonth?.expense?.total ?? null;
  const tasksDueToday  = tasksData?.tasks?.length ?? null;
  const problemsSolved = placementData
    ? Object.values(placementData).reduce((sum, s) => sum + (s?.mastered ?? 0) + (s?.confident ?? 0), 0)
    : null;

  return {
    expense:   monthlyExpense !== null ? `${formatCurrency(monthlyExpense)} spent` : 'Loading…',
    todo:      tasksDueToday  !== null ? `${tasksDueToday} task${tasksDueToday !== 1 ? 's' : ''} due today` : 'Loading…',
    placement: problemsSolved !== null ? `${problemsSolved} topics mastered` : 'Loading…',
    overview:  monthlyExpense !== null ? `${formatCurrency(monthlyExpense)} this month` : 'Loading…',
  };
}

// ── Card component ─────────────────────────────────────────────────────────────
function SegmentCard({ segment, stat, onSelect, index }) {
  return (
    <motion.button
      id={`segment-card-${segment.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.07, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(segment)}
      className={cn(
        'relative flex flex-col justify-between p-5 rounded-3xl text-left',
        'bg-[#111] border border-[#222] overflow-hidden',
        'transition-all duration-200 touch-manipulation',
        'active:border-opacity-60',
      )}
      style={{ minHeight: 160 }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: segment.accent }}
      />

      {/* Accent line top */}
      <div
        className="absolute top-0 left-5 right-5 h-[2px] rounded-b-full opacity-60"
        style={{ background: segment.accent }}
      />

      {/* Icon */}
      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 mb-3"
        style={{ background: `${segment.accent}18`, border: `1px solid ${segment.accent}30` }}
      >
        <span className="text-2xl leading-none">{segment.emoji}</span>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="text-sm font-bold text-[#f0f0f0] leading-tight">{segment.title}</p>
        <p className="text-[11px] text-[#555] mt-0.5 leading-tight">{segment.subtitle}</p>
      </div>

      {/* Live stat */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="text-[10px] font-bold truncate max-w-[80%]"
          style={{ color: segment.accent }}
        >
          {stat}
        </span>
        <ChevronRight size={12} style={{ color: segment.accent }} className="flex-shrink-0" />
      </div>
    </motion.button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const stats     = useLiveStats();

  // If user has a last segment preference → jump straight there
  useEffect(() => {
    const last = localStorage.getItem(LAST_SEGMENT_KEY);
    if (last) {
      navigate(last, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (segment) => {
    localStorage.setItem(LAST_SEGMENT_KEY, segment.route);
    navigate(segment.route);
  };

  const handleForgetSegment = () => {
    localStorage.removeItem(LAST_SEGMENT_KEY);
  };

  return (
    <div
      className="flex flex-col bg-[#0a0a0a] min-h-dvh"
      style={{
        paddingTop:    'calc(env(safe-area-inset-top) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        paddingLeft:   '16px',
        paddingRight:  '16px',
      }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#444] uppercase tracking-widest mb-1">Personal OS</p>
            <h1 className="text-2xl font-black text-[#f0f0f0] leading-tight">
              {greeting()}, {user?.name?.split(' ')[0] || 'Raghav'}
            </h1>
            <p className="text-[12px] text-[#444] mt-1">Where do you want to go?</p>
          </div>

          {/* Switch segment button — only meaningful if navigated here manually */}
          <button
            onClick={handleForgetSegment}
            className="mt-1 px-3 py-1.5 rounded-xl bg-[#111] border border-[#222] text-[10px] font-bold text-[#555] touch-manipulation"
            title="Clear saved segment so this screen shows every time"
          >
            Switch
          </button>
        </div>
      </motion.div>

      {/* ── 2×2 Card Grid ── */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {SEGMENTS.map((seg, i) => (
          <SegmentCard
            key={seg.id}
            segment={seg}
            stat={stats[seg.id]}
            onSelect={handleSelect}
            index={i}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[10px] text-[#2a2a2a] mt-6"
      >
        Tap any card · Your choice is remembered
      </motion.p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
