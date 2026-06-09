import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Code2, StickyNote, Timer,
  BarChart3, PieChart, Target, Flame, Grid3X3,
  LogOut, ChevronRight, X, CheckSquare,
} from 'lucide-react';
import { cn } from '@/utils/cn.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROUTES } from '@/constants/index.js';
import toast from 'react-hot-toast';

// Primary: Dashboard | Expenses | Todo | Placement | More
const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home',      to: ROUTES.DASHBOARD },
  { icon: Wallet,          label: 'Expenses',  to: ROUTES.EXPENSES  },
  { icon: CheckSquare,     label: 'Todo',      to: ROUTES.TODO_TODAY, matchPrefix: '/todo' },
  { icon: Code2,           label: 'Placement', to: ROUTES.PLACEMENT },
];

const MORE_ITEMS = [
  { icon: BarChart3,  label: 'Analytics', to: ROUTES.ANALYTICS },
  { icon: PieChart,   label: 'Budget',    to: ROUTES.BUDGET    },
  { icon: Target,     label: 'Goals',     to: ROUTES.GOALS     },
  { icon: Flame,      label: 'Habits',    to: ROUTES.HABITS    },
  { icon: StickyNote, label: 'Notes',     to: ROUTES.NOTES     },
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

          {/* More tab */}
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
            <span className="text-[9px] font-semibold leading-none tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/70 lg:hidden"
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-3xl overflow-hidden"
              style={{
                background: '#111111',
                borderTop: '1px solid #222222',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-[#333333]" />
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-sm font-bold text-white tracking-tight">More</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl text-[#555] hover:text-white hover:bg-[#222] transition-colors touch-manipulation"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="px-3 mt-1 space-y-1">
                {MORE_ITEMS.map(({ icon: Icon, label, to }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150 min-h-[52px] touch-manipulation',
                        isActive
                          ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/20'
                          : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} className="flex-shrink-0" />
                        <span className="flex-1 text-sm font-semibold">{label}</span>
                        <ChevronRight size={15} className="text-[#333]" />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
              <div className="mx-5 my-3 h-px bg-[#1f1f1f]" />
              <div className="px-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl min-h-[52px] text-[#ef4444] hover:bg-[#ef4444]/8 transition-all duration-150 touch-manipulation"
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
