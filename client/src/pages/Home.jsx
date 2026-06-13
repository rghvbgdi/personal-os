import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, CheckSquare, Code2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROUTES } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';

const LAST_SEGMENT_KEY = 'personal-os:last-segment';

// ── Only 3 Major Components ──
const MODULES = [
  {
    id: 'expense',
    icon: Wallet,
    title: 'Expense Tracker',
    subtitle: 'Manage your finances, track spending, and review analytics.',
    route: ROUTES.DASHBOARD,
    accent: 'from-emerald-400 to-teal-500',
    glow: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
  {
    id: 'todo',
    icon: CheckSquare,
    title: 'Todo Component',
    subtitle: 'Tasks, Calendar, and Sleep Tracking.',
    route: ROUTES.TODO_TODAY,
    accent: 'from-blue-400 to-indigo-500',
    glow: 'bg-blue-500/20',
    text: 'text-blue-400',
  },
  {
    id: 'placement',
    icon: Code2,
    title: 'Placement',
    subtitle: 'DSA tracking, interview prep, and technical notes.',
    route: ROUTES.PLACEMENT,
    accent: 'from-purple-400 to-pink-500',
    glow: 'bg-purple-500/20',
    text: 'text-purple-400',
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user has a last segment preference → jump straight there
  useEffect(() => {
    const last = localStorage.getItem(LAST_SEGMENT_KEY);
    if (last) {
      navigate(last, { replace: true });
    }
  }, [navigate]);

  const handleSelect = (module) => {
    localStorage.setItem(LAST_SEGMENT_KEY, module.route);
    navigate(module.route);
  };

  return (
    <div
      className="h-full min-h-0 flex flex-col bg-black overflow-y-auto overflow-x-hidden scroll-ios"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >
      <div className="px-6 max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mb-10 mt-4"
        >
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Personal OS</p>
          <h1 className="text-3xl font-black text-white leading-tight">
            Welcome back,<br/>
            <span className="text-zinc-400">{user?.name?.split(' ')[0] || 'Raghav'}.</span>
          </h1>
        </motion.div>

        {/* ── The 3 Component Cards ── */}
        <div className="space-y-4 flex-1">
          {MODULES.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(m)}
              className="w-full relative group overflow-hidden rounded-[32px] p-6 text-left border border-white/5 bg-zinc-900/40 touch-manipulation"
            >
              {/* Abstract Glow Background */}
              <div className={cn("absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[50px] opacity-50", m.glow)} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-950 border border-white/5 shadow-xl mb-4", m.text)}>
                  <m.icon size={26} strokeWidth={2} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <ChevronRight size={16} className="text-zinc-500" />
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-black text-white mb-2">{m.title}</h2>
                <p className="text-[13px] text-zinc-400 font-medium leading-relaxed max-w-[85%]">{m.subtitle}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pb-8 mt-12"
        >
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
            Select a module to begin
          </p>
        </motion.div>
      </div>
    </div>
  );
}
