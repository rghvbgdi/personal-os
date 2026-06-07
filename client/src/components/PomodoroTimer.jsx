import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, X, Minimize2, Coffee, Brain, ChevronDown } from 'lucide-react';
import { usePomodoro } from '@/context/PomodoroContext.jsx';
import { pomodoroApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'focus', label: 'Focus', minutes: 25, color: '#059669', icon: Brain },
  { id: 'short-break', label: 'Short Break', minutes: 5, color: '#3b82f6', icon: Coffee },
  { id: 'long-break', label: 'Long Break', minutes: 15, color: '#8b5cf6', icon: Coffee },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function CircleProgress({ pct, color, size = 120, strokeWidth = 5 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f1f1f" strokeWidth={strokeWidth} />
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

export default function PomodoroTimer() {
  const { isVisible, hide } = usePomodoro();
  const qc = useQueryClient();

  const [modeId, setModeId] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const intervalRef = useRef(null);

  const mode = MODES.find((m) => m.id === modeId);
  const totalSeconds = mode.minutes * 60;
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const logMutation = useMutation({
    mutationFn: pomodoroApi.log,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POMODORO_STATS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POMODORO_SESSIONS });
    },
  });

  const { data: statsData } = useQuery({
    queryKey: QUERY_KEYS.POMODORO_STATS,
    queryFn: () => pomodoroApi.getStats().then((r) => r.data.data),
    enabled: isVisible,
  });

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    if (modeId === 'focus') {
      setSessionCount((c) => c + 1);
      logMutation.mutate({ type: 'focus', duration: mode.minutes, taskName, wasCompleted: true });
      toast.success(`🎯 Focus session complete! Session #${sessionCount + 1}`);
    } else {
      toast.success(`☕ Break done! Ready to focus.`);
    }
  }, [modeId, mode.minutes, taskName, sessionCount]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(intervalRef.current); handleComplete(); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleComplete]);

  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(secondsLeft)} · ${mode.label} — Personal OS`;
    } else {
      document.title = 'Personal OS';
    }
    return () => { document.title = 'Personal OS'; };
  }, [isRunning, secondsLeft, mode.label]);

  const switchMode = (newModeId) => {
    const newMode = MODES.find((m) => m.id === newModeId);
    setModeId(newModeId);
    setSecondsLeft(newMode.minutes * 60);
    setIsRunning(false);
    setShowModeMenu(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => { setSecondsLeft(mode.minutes * 60); setIsRunning(false); clearInterval(intervalRef.current); };
  const toggle = () => setIsRunning((v) => !v);

  const todaySessions = statsData?.today?.sessions || 0;
  const todayMinutes = statsData?.today?.totalMinutes || 0;
  const ModeIcon = mode.icon;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-5 right-5 z-[90]"
        >
          <div
            className={cn(
              'bg-surface border border-border rounded-2xl shadow-elevated overflow-hidden transition-all duration-300',
              isMinimized ? 'w-[200px]' : 'w-[280px]',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ModeIcon className="h-4 w-4" style={{ color: mode.color }} />
                <button
                  onClick={() => setShowModeMenu((v) => !v)}
                  className="flex items-center gap-1 text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                >
                  {mode.label}
                  <ChevronDown className="h-3 w-3 text-text-muted" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized((v) => !v)}
                  className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors">
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={hide}
                  className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mode menu */}
            <AnimatePresence>
              {showModeMenu && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden border-b border-border">
                  {MODES.map((m) => (
                    <button key={m.id} onClick={() => switchMode(m.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        modeId === m.id ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface-2',
                      )}>
                      <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                      <span>{m.label}</span>
                      <span className="ml-auto text-text-muted text-xs">{m.minutes}m</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="p-4 space-y-4">
                    {/* Task input */}
                    <input
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="What are you working on?"
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />

                    {/* Timer circle */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <CircleProgress pct={pct} color={mode.color} size={120} strokeWidth={5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                            {formatTime(secondsLeft)}
                          </span>
                          <span className="text-[10px] text-text-muted mt-0.5">{mode.label}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button onClick={reset}
                          className="p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={toggle}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-150 text-white shadow-glow-sm"
                          style={{ background: mode.color }}
                        >
                          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isRunning ? 'Pause' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-text-secondary">{sessionCount}</span> this session
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-text-secondary">{todaySessions}</span> today
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-text-secondary">{todayMinutes}m</span> focused
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
