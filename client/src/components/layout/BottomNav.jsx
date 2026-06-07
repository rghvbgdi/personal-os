import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Target, Flame, Grid3X3,
  BarChart3, PieChart, Code2, StickyNote, Timer,
  LogOut, ChevronRight, X,
} from 'lucide-react';
import { cn } from '@/utils/cn.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROUTES } from '@/constants/index.js';
import toast from 'react-hot-toast';

const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: ROUTES.DASHBOARD },
  { icon: Wallet,          label: 'Expenses',  to: ROUTES.EXPENSES  },
  { icon: Target,          label: 'Goals',     to: ROUTES.GOALS     },
  { icon: Flame,           label: 'Habits',    to: ROUTES.HABITS    },
];

const MORE_ITEMS = [
  { icon: BarChart3,  label: 'Analytics', to: ROUTES.ANALYTICS  },
  { icon: PieChart,   label: 'Budget',    to: ROUTES.BUDGET     },
  { icon: Code2,      label: 'Placement', to: ROUTES.PLACEMENT  },
  { icon: StickyNote, label: 'Notes',     to: ROUTES.NOTES      },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

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
          background: '#171717',
          borderTop: '1px solid #262626',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch">
          {PRIMARY_TABS.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-[3px] py-2 min-h-[56px] transition-colors duration-150 relative touch-manipulation',
                  isActive ? 'text-[#059669]' : 'text-[#525252]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator dot */}
                  <span
                    className={cn(
                      'absolute top-1.5 w-1 h-1 rounded-full transition-all duration-200',
                      isActive ? 'bg-[#059669] opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-[3px] py-2 min-h-[56px] transition-colors duration-150 touch-manipulation relative',
              moreOpen ? 'text-[#059669]' : 'text-[#525252]',
            )}
          >
            <span
              className={cn(
                'absolute top-1.5 w-1 h-1 rounded-full transition-all duration-200',
                moreOpen ? 'bg-[#059669] opacity-100' : 'opacity-0',
              )}
            />
            <Grid3X3 size={24} strokeWidth={moreOpen ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="more-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-2xl overflow-hidden"
              style={{
                background: '#171717',
                borderTop: '1px solid #262626',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#404040]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-[#fafafa]">More</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-lg text-[#525252] hover:text-[#fafafa] hover:bg-[#262626] transition-colors touch-manipulation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav Items */}
              <div className="px-3 space-y-0.5">
                {MORE_ITEMS.map(({ icon: Icon, label, to }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-150 min-h-[56px] touch-manipulation',
                        isActive
                          ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/20'
                          : 'text-[#a3a3a3] hover:text-[#fafafa] hover:bg-[#262626]',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium">{label}</span>
                        <ChevronRight size={16} className="text-[#404040]" />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-4 my-3 h-px bg-[#262626]" />

              {/* Logout */}
              <div className="px-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl min-h-[56px] text-[#ef4444] hover:bg-[#ef4444]/5 transition-all duration-150 touch-manipulation"
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
