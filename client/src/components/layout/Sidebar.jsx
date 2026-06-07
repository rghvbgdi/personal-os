import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, BarChart3, Target, PieChart,
  Code2, StickyNote, Flame, LogOut, ChevronLeft, Zap, Timer,
} from 'lucide-react';
import { cn } from '@/utils/cn.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useSidebar } from '@/context/SidebarContext.jsx';
import { useCommandPalette } from '@/context/CommandPaletteContext.jsx';
import { usePomodoro } from '@/context/PomodoroContext.jsx';
import { ROUTES } from '@/constants/index.js';
import { getInitials } from '@/utils/formatters.js';
import toast from 'react-hot-toast';

const SECTIONS = [
  {
    label: 'Finance',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: ROUTES.DASHBOARD },
      { icon: Wallet, label: 'Expenses', to: ROUTES.EXPENSES },
      { icon: BarChart3, label: 'Analytics', to: ROUTES.ANALYTICS },
      { icon: PieChart, label: 'Budget', to: ROUTES.BUDGET },
      { icon: Target, label: 'Goals', to: ROUTES.GOALS },
    ],
  },
  {
    label: 'Career',
    items: [
      { icon: Code2, label: 'Placement', to: ROUTES.PLACEMENT },
      { icon: StickyNote, label: 'Notes', to: ROUTES.NOTES },
    ],
  },
  {
    label: 'Life',
    items: [
      { icon: Flame, label: 'Habits', to: ROUTES.HABITS },
    ],
  },
];

function NavItem({ icon: Icon, label, to, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative',
        isActive
          ? 'bg-accent-subtle text-accent border border-accent-muted shadow-glow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className="h-[17px] w-[17px] flex-shrink-0" />
      {!collapsed && <span className="truncate text-[13px]">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 z-50 hidden group-hover:flex items-center pointer-events-none">
          <div className="bg-surface-2 border border-border text-text-primary text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-elevated">
            {label}
          </div>
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, isCollapsed, close, toggleCollapse } = useSidebar();
  const { open: openCmdPalette } = useCommandPalette();
  const { isVisible: pomodoroVisible, toggle: togglePomodoro } = usePomodoro();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
    toast.success('Logged out');
  };

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-surface border-r border-border transition-all duration-300',
      isCollapsed ? 'w-[52px]' : 'w-[212px]',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 px-3 border-b border-border gap-2.5 flex-shrink-0',
        isCollapsed && 'justify-center px-2',
      )}>
        <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-text-primary leading-none">Personal OS</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-none">your life, systematized</p>
          </div>
        )}
      </div>

      {/* Search trigger */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={openCmdPalette}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-secondary hover:border-border transition-all text-xs"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] px-1 py-0.5 rounded bg-border text-text-muted font-mono">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 px-2 py-2 space-y-3 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-1">
                {section.label}
              </p>
            )}
            {isCollapsed && <div className="h-px bg-border mx-1 my-1.5" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} collapsed={isCollapsed} onClick={close} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={cn('px-2 pb-3 pt-2 border-t border-border space-y-1 flex-shrink-0')}>
        {/* Pomodoro toggle */}
        <button
          onClick={togglePomodoro}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
            pomodoroVisible
              ? 'bg-warning/10 text-warning border border-warning/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
            isCollapsed && 'justify-center px-2',
          )}
        >
          <Timer className="h-[17px] w-[17px] flex-shrink-0" />
          {!isCollapsed && <span className="text-[13px]">Focus Timer</span>}
        </button>

        {/* User info */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-accent-muted border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-accent">{getInitials(user.name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate leading-none">{user.name}</p>
              <p className="text-[10px] text-text-muted truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-text-secondary hover:text-danger hover:bg-danger/5 transition-all duration-150',
            isCollapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && 'Logout'}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex w-full items-center justify-center py-1.5 rounded-lg text-[10px] text-text-muted hover:text-text-secondary hover:bg-surface-2 transition-all gap-1.5"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', isCollapsed && 'rotate-180')} />
          {!isCollapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-shrink-0">{sidebarContent}</aside>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={close}
            />
            <motion.aside
              initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <div className="w-[212px] h-full">{sidebarContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
