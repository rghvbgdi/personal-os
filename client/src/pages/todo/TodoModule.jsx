import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Moon, Timer } from 'lucide-react';
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

  return (
    <div className="flex flex-col bg-[#0a0a0a] overflow-hidden" style={{ height: '100dvh' }}>

      {/* Page content — scrollable */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/todo/today" replace />} />
            <Route path="/today"    element={<TodayTab />} />
            <Route path="/tasks"    element={<TasksTab />} />
            <Route path="/calendar" element={<CalendarTab />} />
            <Route path="/sleep"    element={<SleepTab />} />
            <Route path="/focus"    element={<FocusTab />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav
        className="flex-shrink-0 z-40"
        style={{
          background: 'rgba(10,10,10,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #1a1a1a',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch h-[56px]">
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
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#6c63ff]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className="text-[9px] font-semibold leading-none tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
