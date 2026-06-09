import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Moon, Timer, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn.js';
import TodayTab from './TodayTab.jsx';
import TasksTab from './TasksTab.jsx';
import CalendarTab from './CalendarTab.jsx';
import SleepTab from './SleepTab.jsx';
import FocusTab from './FocusTab.jsx';

const TABS = [
  { to: '/todo/today',    icon: Home,        label: 'Today'    },
  { to: '/todo/tasks',    icon: CheckSquare, label: 'Tasks'    },
  { to: '/todo/calendar', icon: Calendar,    label: 'Calendar' },
  { to: '/todo/sleep',    icon: Moon,        label: 'Sleep'    },
  { to: '/todo/focus',    icon: Timer,       label: 'Focus'    },
];

export default function TodoModule() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    // position:fixed inset-0 is the most reliable layout on iOS PWA
    // (avoids 100dvh quirks with dynamic island / safe areas)
    <div
      className="flex flex-col bg-[#0a0a0a]"
      style={{ position: 'fixed', inset: 0 }}
    >
      {/* ── Top header: back button + section label ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
          paddingBottom: 10,
          background: 'rgba(10,10,10,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#1a1a1a] text-[#666] hover:text-white transition-colors touch-manipulation flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-[#888] tracking-tight">Personal OS</span>
      </div>

      {/* ── Page content — scrollable ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"          element={<Navigate to="/todo/today" replace />} />
            <Route path="/today"     element={<TodayTab />} />
            <Route path="/tasks"     element={<TasksTab />} />
            <Route path="/calendar"  element={<CalendarTab />} />
            <Route path="/sleep"     element={<SleepTab />} />
            <Route path="/focus"     element={<FocusTab />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* ── Inner Tab Bar — sits at physical bottom ── */}
      <nav
        className="flex-shrink-0"
        style={{
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #1a1a1a',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch h-[54px]">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors duration-150 relative touch-manipulation select-none',
                isActive ? 'text-[#6c63ff]' : 'text-[#404040]',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="todo-nav-pill"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[2px] rounded-full bg-[#6c63ff]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className="text-[8.5px] font-semibold leading-none tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
