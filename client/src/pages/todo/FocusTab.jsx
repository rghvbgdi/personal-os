import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  Play, Pause, RotateCcw, Brain, Coffee, Zap,
  BarChart2, CheckCircle2, Clock, Target,
} from 'lucide-react';
import { pomodoroApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'focus',       label: 'Focus',       minutes: 25, color: '#6c63ff', icon: Brain,  shortLabel: '25m' },
  { id: 'short-break', label: 'Short Break', minutes: 5,  color: '#22c55e', icon: Coffee, shortLabel: '5m'  },
  { id: 'long-break',  label: 'Long Break',  minutes: 15, color: '#f59e0b', icon: Coffee, shortLabel: '15m' },
];

const CUSTOM_DURATIONS = [15, 25, 30, 45, 50, 60];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtMinutes(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Circular Progress SVG ──────────────────────────────────────────────────────
function CircleProgress({ pct, color, size = 220, strokeWidth = 8 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = '#6c63ff' }) {
  return (
    <div className="flex-1 rounded-2xl bg-[#111] border border-[#1e1e1e] p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#444]">{label}</span>
      </div>
      <p className="text-base font-bold text-[#e0e0e0] leading-tight">{value}</p>
    </div>
  );
}

// ── Session history row ────────────────────────────────────────────────────────
function SessionRow({ session }) {
  const isToday = (d) => {
    const n = new Date();
    const s = new Date(d);
    return n.getFullYear() === s.getFullYear() && n.getMonth() === s.getMonth() && n.getDate() === s.getDate();
  };
  const modeColor = session.type === 'focus' ? '#6c63ff' : session.type === 'short-break' ? '#22c55e' : '#f59e0b';
  const modeLabel = session.type === 'focus' ? 'Focus' : session.type === 'short-break' ? 'Short Break' : 'Long Break';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#111] last:border-0">
      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: modeColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#ccc] truncate">
          {session.taskName || modeLabel}
        </p>
        <p className="text-[10px] text-[#444] mt-0.5">
          {isToday(session.completedAt) ? format(new Date(session.completedAt), 'h:mm a') : format(new Date(session.completedAt), 'EEE, d MMM · h:mm a')}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: `${modeColor}18`, color: modeColor }}
        >
          {modeLabel}
        </span>
        <span className="text-[10px] text-[#444]">{session.duration}m</span>
        {session.wasCompleted && <CheckCircle2 size={11} className="text-[#22c55e]" />}
      </div>
    </div>
  );
}

// ── Main FocusTab ──────────────────────────────────────────────────────────────
export default function FocusTab() {
  const qc = useQueryClient();

  // Timer state
  const [modeId, setModeId] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [customDuration, setCustomDuration] = useState(null); // override focus duration
  const intervalRef = useRef(null);

  const mode = MODES.find((m) => m.id === modeId);
  const totalSeconds = (modeId === 'focus' && customDuration ? customDuration : mode.minutes) * 60;
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Queries
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.POMODORO_STATS,
    queryFn: () => pomodoroApi.getStats().then((r) => r.data.data),
  });

  const { data: sessionsData } = useQuery({
    queryKey: QUERY_KEYS.POMODORO_SESSIONS,
    queryFn: () => pomodoroApi.getSessions({ limit: 20 }).then((r) => r.data.data),
  });

  const logMutation = useMutation({
    mutationFn: pomodoroApi.log,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POMODORO_STATS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POMODORO_SESSIONS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
    },
  });

  // Timer logic
  const handleComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);

    if (modeId === 'focus') {
      const dur = customDuration || mode.minutes;
      setSessionCount((c) => c + 1);
      logMutation.mutate({ type: 'focus', duration: dur, taskName, wasCompleted: true });
      toast.success(`🎯 Focus session complete! ${sessionCount + 1} session${sessionCount + 1 > 1 ? 's' : ''} today`);
      // Auto-suggest break
      setTimeout(() => {
        setModeId((sessionCount + 1) % 4 === 0 ? 'long-break' : 'short-break');
        setSecondsLeft(((sessionCount + 1) % 4 === 0 ? 15 : 5) * 60);
        setCustomDuration(null);
      }, 800);
    } else {
      logMutation.mutate({ type: modeId, duration: mode.minutes, taskName: '', wasCompleted: true });
      toast.success('☕ Break complete! Ready to focus?');
      setTimeout(() => {
        setModeId('focus');
        setSecondsLeft((customDuration || 25) * 60);
      }, 800);
    }
  }, [modeId, mode.minutes, taskName, sessionCount, customDuration, logMutation]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleComplete]);

  // Update page title while running
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(secondsLeft)} — ${mode.label} | Personal OS`;
    } else {
      document.title = 'Personal OS';
    }
    return () => { document.title = 'Personal OS'; };
  }, [isRunning, secondsLeft, mode.label]);

  const handleModeChange = (newModeId) => {
    if (isRunning) {
      logMutation.mutate({ type: modeId, duration: Math.round((totalSeconds - secondsLeft) / 60), taskName, wasCompleted: false });
    }
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setCustomDuration(null);
    const newMode = MODES.find((m) => m.id === newModeId);
    setModeId(newModeId);
    setSecondsLeft(newMode.minutes * 60);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const handleCustomDuration = (mins) => {
    if (isRunning) return;
    setCustomDuration(mins);
    setSecondsLeft(mins * 60);
    setModeId('focus');
  };

  const sessions = sessionsData?.sessions || [];
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.completedAt);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="px-4 pb-8"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
    >
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#f0f0f0] leading-tight">Focus</h1>
        <p className="text-[11px] text-[#444] mt-0.5 font-medium">
          {sessionCount > 0 ? `${sessionCount} session${sessionCount > 1 ? 's' : ''} this run` : 'Start a Pomodoro session'}
        </p>
      </div>

      {/* ── Mode selector ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            id={`focus-mode-${m.id}`}
            onClick={() => handleModeChange(m.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all touch-manipulation',
              modeId === m.id
                ? 'border-transparent text-white'
                : 'border-[#1e1e1e] text-[#444] bg-[#111]',
            )}
            style={modeId === m.id ? { background: m.color } : {}}
          >
            <m.icon size={11} />
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Task name input ── */}
      {modeId === 'focus' && (
        <div className="mb-5">
          <input
            id="focus-task-name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="What are you working on? (optional)"
            disabled={isRunning}
            className="w-full py-2.5 px-4 bg-[#111] border border-[#1e1e1e] rounded-2xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/50 transition-colors disabled:opacity-50"
          />
        </div>
      )}

      {/* ── Custom duration pills (focus only, not running) ── */}
      {modeId === 'focus' && !isRunning && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {CUSTOM_DURATIONS.map((mins) => (
            <button
              key={mins}
              onClick={() => handleCustomDuration(mins)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all touch-manipulation',
                (customDuration === mins || (!customDuration && mins === 25))
                  ? 'bg-[#6c63ff]/20 border-[#6c63ff]/40 text-[#6c63ff]'
                  : 'border-[#1e1e1e] text-[#444] bg-[#111]',
              )}
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      {/* ── Timer ring ── */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative flex items-center justify-center">
          <CircleProgress pct={pct} color={mode.color} size={220} strokeWidth={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span
              className="text-5xl font-black tabular-nums leading-none"
              style={{ color: mode.color }}
              aria-live="polite"
              aria-label={`${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#444]">
              {mode.label}
            </span>
            {sessionCount > 0 && (
              <div className="flex gap-1 mt-1">
                {Array.from({ length: Math.min(sessionCount, 4) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#6c63ff]" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          id="focus-reset-btn"
          onClick={handleReset}
          className="h-11 w-11 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#444] hover:text-[#888] transition-colors touch-manipulation"
          aria-label="Reset timer"
        >
          <RotateCcw size={16} />
        </button>

        <button
          id="focus-play-btn"
          onClick={() => setIsRunning((r) => !r)}
          className="h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-lg touch-manipulation active:scale-95"
          style={{ background: mode.color }}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          <AnimatePresence mode="wait">
            {isRunning
              ? <motion.div key="pause" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}><Pause size={24} className="text-white" /></motion.div>
              : <motion.div key="play" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}><Play size={24} className="text-white ml-0.5" /></motion.div>
            }
          </AnimatePresence>
        </button>

        <button
          id="focus-skip-btn"
          onClick={handleComplete}
          className="h-11 w-11 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#444] hover:text-[#888] transition-colors touch-manipulation"
          aria-label="Skip session"
          title="Mark as complete early"
        >
          <Zap size={16} />
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-2.5 mb-6">
        <StatCard
          icon={Target}
          label="Today's sessions"
          value={`${todaySessions.filter((s) => s.type === 'focus').length} sessions`}
          color="#6c63ff"
        />
        <StatCard
          icon={Clock}
          label="Focus time today"
          value={fmtMinutes(todaySessions.filter((s) => s.type === 'focus').reduce((a, s) => a + (s.duration || 0), 0))}
          color="#22c55e"
        />
        <StatCard
          icon={BarChart2}
          label="All-time sessions"
          value={`${stats?.allTime?.sessions ?? 0}`}
          color="#f59e0b"
        />
      </div>

      {/* ── Session history ── */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-[#555] uppercase tracking-widest mb-3">Recent Sessions</h2>
          <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] px-4">
            {sessions.slice(0, 12).map((s) => (
              <SessionRow key={s._id} session={s} />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && !isRunning && (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">🧠</p>
          <p className="text-sm font-semibold text-[#333]">No sessions yet</p>
          <p className="text-[10px] text-[#2a2a2a] mt-1">Start your first Pomodoro to begin tracking focus time</p>
        </div>
      )}
    </motion.div>
  );
}
