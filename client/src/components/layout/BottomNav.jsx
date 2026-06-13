import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Code2, StickyNote, Timer,
  BarChart3, PieChart, Target, Flame, Grid3X3,
  LogOut, ChevronRight, X, CheckSquare, Moon, CalendarDays,
  Home, Zap, Layout
} from 'lucide-react';
import { cn } from '@/utils/cn.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROUTES } from '@/constants/index.js';
import toast from 'react-hot-toast';

const EXPENSE_TABS = [
  { icon: LayoutDashboard, label: 'Home',      to: ROUTES.DASHBOARD },
  { icon: Wallet,          label: 'Expenses',  to: ROUTES.EXPENSES  },
  { icon: BarChart3,       label: 'Analytics', to: ROUTES.ANALYTICS },
  { icon: PieChart,        label: 'Budget',    to: ROUTES.BUDGET    },
];

const TODO_TABS = [
  { icon: Home,            label: 'Today',     to: ROUTES.TODO_TODAY },
  { icon: CheckSquare,     label: 'Tasks',     to: ROUTES.TODO_TASKS },
  { icon: CalendarDays,    label: 'Calendar',  to: ROUTES.TODO_CALENDAR },
  { icon: Moon,            label: 'Sleep',     to: ROUTES.TODO_SLEEP },
];

const PLACEMENT_TABS = [
  { icon: Code2,           label: 'Prep',      to: ROUTES.PLACEMENT },
  { icon: StickyNote,      label: 'Notes',     to: ROUTES.NOTES },
  { icon: Zap,             label: 'Habits',    to: ROUTES.HABITS },
];

const MODULES = [
  {
    id: 'expense',
    label: 'Expense Tracker',
    icon: Wallet,
    to: ROUTES.DASHBOARD,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400'
  },
  {
    id: 'todo',
    label: 'Todo List',
    icon: CheckSquare,
    to: ROUTES.TODO_TODAY,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400'
  },
  {
    id: 'placement',
    label: 'Placement Hub',
    icon: Code2,
    to: ROUTES.PLACEMENT,
    bg: 'bg-purple-500/10',
    text: 'text-purple-400'
  },
];

export default function BottomNav() {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const context = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/todo')) return 'todo';
    if (path.startsWith('/placement') || path.startsWith('/notes') || path.startsWith('/habits')) return 'placement';
    return 'expense';
  }, [location.pathname]);

  const activeTabs = useMemo(() => {
    if (context === 'todo') return TODO_TABS;
    if (context === 'placement') return PLACEMENT_TABS;
    return EXPENSE_TABS;
  }, [context]);

  const handleLogout = async () => {
    setSwitcherOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
    toast.success('Logged out');
  };

  const navigateTo = (to) => {
    setSwitcherOpen(false);
    navigate(to);
  };

  return (
    <>
      {/*
        BottomNav is a FLEX CHILD of the PageLayout flex column — NOT position:fixed.
        
        flex-shrink-0 ensures it never collapses.
        
        paddingBottom: env(safe-area-inset-bottom)
          - Pushes the tap targets above the home indicator.
          - The nav's background (#000000) fills this padding area,
            covering all the way to the physical screen edge.
          - On iPhone 14 Pro: ~34px for the home indicator.
          - Result: NO gap below the nav. Zero. Ever.
        
        This approach is immune to viewport miscalculations because the nav
        is part of the flex flow. It doesn't rely on position:fixed alignment,
        which can drift when window.innerHeight or 100dvh is slightly off.
      */}
      <nav
        className="flex-shrink-0 z-40 lg:hidden"
        style={{
          background: '#000000',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch h-14">
          {activeTabs.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative',
                  isActive ? 'text-white' : 'text-zinc-600'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className="transition-transform active:scale-90" />
                <span className="text-[9px] font-bold tracking-tight uppercase opacity-80">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -top-px w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
                  />
                )}
              </button>
            );
          })}

          <button
            onClick={() => setSwitcherOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              switcherOpen ? 'text-white' : 'text-zinc-600'
            )}
          >
            <div className="relative">
              <Layout size={20} strokeWidth={switcherOpen ? 2.5 : 1.5} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-black" />
            </div>
            <span className="text-[9px] font-bold tracking-tight uppercase opacity-80">More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {switcherOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSwitcherOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] border-t border-white/10 rounded-t-[40px] px-6 pt-4 lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 24px)' }}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white tracking-tight">Personal OS</h2>
                <button
                  onClick={() => setSwitcherOpen(false)}
                  className="p-2 rounded-full bg-zinc-900 text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {MODULES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigateTo(m.to)}
                    className="w-full group relative flex items-center gap-4 p-4 rounded-3xl bg-zinc-900/50 border border-white/5 active:scale-[0.98] transition-all"
                  >
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', m.bg)}>
                      <m.icon size={24} className={m.text} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-white">{m.label}</p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Component</p>
                    </div>
                    <ChevronRight size={18} className="text-zinc-700 group-active:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-3xl text-rose-500 font-black text-sm active:bg-rose-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span>SIGN OUT</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
