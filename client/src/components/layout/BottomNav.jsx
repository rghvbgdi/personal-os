import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Code2, StickyNote,
  BarChart3, PieChart,
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
    bg: 'bg-[#D97757]/12',
    text: 'text-[#D97757]',
  },
  {
    id: 'todo',
    label: 'Todo & Sleep',
    icon: CheckSquare,
    to: ROUTES.TODO_TODAY,
    bg: 'bg-[#60A5FA]/12',
    text: 'text-[#60A5FA]',
  },
  {
    id: 'placement',
    label: 'Placement Hub',
    icon: Code2,
    to: ROUTES.PLACEMENT,
    bg: 'bg-[#A8A29E]/12',
    text: 'text-[#A8A29E]',
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
      <div
        className="flex-shrink-0 lg:hidden"
        style={{
          background: '#1C1917',
          borderTop: '1px solid rgba(217,119,87,0.1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center h-16 px-2">
          {activeTabs.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                aria-label={label}
                className="flex-1 flex items-center justify-center h-full touch-manipulation"
              >
                <motion.div
                  className="flex items-center justify-center rounded-2xl transition-colors duration-200"
                  style={{
                    width: 48,
                    height: 48,
                    marginBottom: 16,
                    background: isActive ? 'rgba(217,119,87,0.14)' : 'transparent',
                  }}
                  whileTap={{ scale: 0.88 }}
                >
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? '#D97757' : '#78716C'}
                  />
                </motion.div>
              </button>
            );
          })}

          <button
            onClick={() => setSwitcherOpen(true)}
            aria-label="More"
            className="flex-1 flex items-center justify-center h-full touch-manipulation"
          >
            <motion.div
              className="flex items-center justify-center rounded-2xl transition-colors duration-200 relative"
              style={{
                width: 48,
                height: 48,
                marginBottom: 16,
                background: switcherOpen ? 'rgba(217,119,87,0.14)' : 'transparent',
              }}
              whileTap={{ scale: 0.88 }}
            >
              <Layout
                size={26}
                strokeWidth={switcherOpen ? 2.5 : 1.8}
                color={switcherOpen ? '#D97757' : '#78716C'}
              />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#D97757] rounded-full border-2 border-[#1C1917]" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {switcherOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSwitcherOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[36px] px-6 pt-4 lg:hidden"
              style={{
                background: '#231F1C',
                borderTop: '1px solid rgba(217,119,87,0.1)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 24px)',
              }}
            >
              <div className="w-10 h-1 bg-[#403C39] rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between mb-7">
                <h2 className="text-lg font-bold text-[#F5EDE0] tracking-tight">Personal OS</h2>
                <button
                  onClick={() => setSwitcherOpen(false)}
                  className="p-2 rounded-full bg-[#312D2A] text-[#78716C]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5">
                {MODULES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigateTo(m.to)}
                    className="w-full group relative flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-all"
                    style={{ background: '#2D2926', border: '1px solid rgba(217,119,87,0.08)' }}
                  >
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', m.bg)}>
                      <m.icon size={22} className={m.text} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-[#F5EDE0]">{m.label}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#544F4C] group-active:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-7 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[#EF4444] font-semibold text-sm active:bg-[#EF4444]/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
