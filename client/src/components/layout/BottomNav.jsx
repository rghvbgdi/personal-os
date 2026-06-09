import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Code2, StickyNote, Timer,
  BarChart3, PieChart, Target, Flame, Grid3X3,
  LogOut, ChevronRight, X, CheckSquare, Moon, CalendarDays,
} from 'lucide-react';
import { cn } from '@/utils/cn.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROUTES } from '@/constants/index.js';
import toast from 'react-hot-toast';

// 4 Primary tabs at the bottom + Menu
const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home',      to: ROUTES.DASHBOARD },
  { icon: Wallet,          label: 'Expenses',  to: ROUTES.EXPENSES  },
  { icon: CheckSquare,     label: 'Tasks',     to: ROUTES.TODO_TODAY, matchPrefix: '/todo' },
  { icon: Code2,           label: 'Placement', to: ROUTES.PLACEMENT },
];

// All Modules in the Grid Switcher
const ALL_MODULES = [
  { icon: Wallet,      label: 'Expenses',   to: ROUTES.EXPENSES,  color: 'bg-emerald-500',  text: 'text-emerald-500' },
  { icon: CheckSquare, label: 'To-Do',      to: ROUTES.TODO_TODAY,color: 'bg-blue-500',     text: 'text-blue-500' },
  { icon: Code2,       label: 'Placement',  to: ROUTES.PLACEMENT, color: 'bg-indigo-500',   text: 'text-indigo-500' },
  { icon: Timer,       label: 'Pomodoro',   to: ROUTES.POMODORO,  color: 'bg-rose-500',     text: 'text-rose-500' },
  { icon: Target,      label: 'Goals',      to: ROUTES.GOALS,     color: 'bg-cyan-500',     text: 'text-cyan-500' },
  { icon: Flame,       label: 'Habits',     to: ROUTES.HABITS,    color: 'bg-amber-500',    text: 'text-amber-500' },
  { icon: Moon,        label: 'Sleep',      to: ROUTES.SLEEP,     color: 'bg-violet-500',   text: 'text-violet-500' },
  { icon: CalendarDays,label: 'Calendar',   to: ROUTES.EVENTS,    color: 'bg-pink-500',     text: 'text-pink-500' },
  { icon: StickyNote,  label: 'Notes',      to: ROUTES.NOTES,     color: 'bg-yellow-500',   text: 'text-yellow-500' },
  { icon: BarChart3,   label: 'Analytics',  to: ROUTES.ANALYTICS, color: 'bg-teal-500',     text: 'text-teal-500' },
  { icon: PieChart,    label: 'Budget',     to: ROUTES.BUDGET,    color: 'bg-fuchsia-500',  text: 'text-fuchsia-500' },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setMoreOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
    toast.success('Logged out');
  };

  const navigateTo = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #1f1f1f',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch h-[56px]">
          {/* Menu button on the far left or right? Let's put it on far right to replace previous "More" */}
          {PRIMARY_TABS.map(({ icon: Icon, label, to, matchPrefix }) => {
            const isActive = matchPrefix
              ? location.pathname.startsWith(matchPrefix)
              : location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors duration-150 relative touch-manipulation select-none',
                  isActive ? 'text-[#059669]' : 'text-[#4a4a4a]',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#059669]"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} />
                <span className="text-[9px] font-semibold leading-none tracking-tight">{label}</span>
              </button>
            );
          })}

          {/* Apps/Menu tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors duration-150 touch-manipulation relative select-none',
              moreOpen ? 'text-[#059669]' : 'text-[#4a4a4a]',
            )}
          >
            {moreOpen && (
              <motion.span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#059669]"
              />
            )}
            <Grid3X3 size={22} strokeWidth={moreOpen ? 2.2 : 1.7} />
            <span className="text-[9px] font-semibold leading-none tracking-tight">Apps</span>
          </button>
        </div>
      </nav>

      {/* Modern App Switcher Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="more-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              onClick={() => setMoreOpen(false)}
            />
            {/* Bottom Sheet */}
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-3xl overflow-hidden shadow-2xl"
              style={{
                background: '#0f0f0f',
                borderTop: '1px solid #222222',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              }}
            >
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-[#333333]" />
              </div>

              <div className="px-6 pt-4 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">App Switcher</h2>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="p-2 rounded-full bg-[#1a1a1a] text-[#888] hover:text-white transition-colors touch-manipulation"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Grid of Apps */}
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                  {ALL_MODULES.map(({ icon: Icon, label, to, color, text }) => (
                    <button
                      key={to}
                      onClick={() => navigateTo(to)}
                      className="flex flex-col items-center gap-2 touch-manipulation group"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-opacity-15 shadow-sm border border-white/5 transition-transform group-active:scale-95",
                        color.replace('bg-', 'bg-').concat('/15') // dynamic tailwind classes can be tricky, we'll use inline styles for the glow if needed, but standard TW arbitrary classes work best here. 
                        // Wait, using string replacement for arbitrary opacities in TW doesn't work well if not safelisted. 
                        // Instead, we just map it out, or use standard bg colors and mix-blend/opacity.
                      )}>
                        {/* We use an explicit container for the icon bg */}
                        <div className={cn("absolute inset-0 rounded-2xl opacity-15", color)} />
                        <Icon size={26} strokeWidth={2} className={text} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#888] tracking-tight">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-[#1f1f1f]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all font-semibold touch-manipulation"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
