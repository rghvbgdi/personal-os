import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { Moon, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { sleepApi } from '@/api/index.js';
import { QUERY_KEYS, SLEEP_QUALITY } from '@/constants/index.js';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const SLEEP_GOAL = 8 * 60; // 8 hours in minutes

function fmtDuration(mins) {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

// ── Log Sleep Sheet ───────────────────────────────────────────────────────────
function LogSleepSheet({ open, onClose }) {
  const qc = useQueryClient();
  const yesterday = subDays(new Date(), 1);
  const [sleepDate, setSleepDate] = useState(format(yesterday, 'yyyy-MM-dd'));
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeDate, setWakeDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => sleepApi.log(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP_INSIGHTS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
      toast.success('Sleep logged');
      onClose();
    },
  });

  const handleSave = () => {
    const sleepDateTime = `${sleepDate}T${sleepTime}:00`;
    const wakeDateTime  = `${wakeDate}T${wakeTime}:00`;
    if (new Date(wakeDateTime) <= new Date(sleepDateTime)) {
      return toast.error('Wake time must be after sleep time');
    }
    mutation.mutate({ sleepTime: sleepDateTime, wakeTime: wakeDateTime, quality, notes });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl"
            style={{
              background: '#0d1020',
              borderTop: '1px solid #1e2040',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight: '85dvh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-[#2a3060]" />
            </div>

            <div className="px-5 pb-4">
              <h3 className="text-sm font-bold text-[#d0d8ff] mb-5">Log Sleep</h3>

              <div className="space-y-4">
                {/* Sleep time */}
                <div>
                  <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-wider mb-2">I fell asleep</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#1e2040] rounded-xl text-sm text-[#aab] focus:outline-none focus:border-[#6c63ff]/60"
                    />
                    <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#1e2040] rounded-xl text-sm text-[#aab] focus:outline-none focus:border-[#6c63ff]/60"
                    />
                  </div>
                </div>

                {/* Wake time */}
                <div>
                  <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-wider mb-2">I woke up</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={wakeDate} onChange={(e) => setWakeDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#1e2040] rounded-xl text-sm text-[#aab] focus:outline-none focus:border-[#6c63ff]/60"
                    />
                    <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#1e2040] rounded-xl text-sm text-[#aab] focus:outline-none focus:border-[#6c63ff]/60"
                    />
                  </div>
                </div>

                {/* Quality */}
                <div>
                  <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-wider mb-2">Sleep quality</p>
                  <div className="flex gap-2">
                    {SLEEP_QUALITY.map((q) => (
                      <button
                        key={q.value} onClick={() => setQuality(q.value)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all touch-manipulation',
                          quality === q.value
                            ? 'border-[#6c63ff] bg-[#6c63ff]/15'
                            : 'border-[#1e2040] bg-[#080d1a]',
                        )}
                      >
                        <span className="text-lg">{q.emoji}</span>
                        <span className={cn('text-[8px] font-bold', quality === q.value ? 'text-[#6c63ff]' : 'text-[#4a5080]')}>
                          {q.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <input
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (had coffee late, woke at 3am…)"
                  className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#1e2040] rounded-xl text-sm text-[#aab] placeholder:text-[#334] focus:outline-none focus:border-[#6c63ff]/60"
                />

                <button
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="w-full py-3.5 rounded-xl bg-[#6c63ff] text-white text-sm font-bold disabled:opacity-40 touch-manipulation"
                >
                  {mutation.isPending ? 'Saving…' : 'Log Sleep'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main: SleepTab ─────────────────────────────────────────────────────────────
export default function SleepTab() {
  const [logOpen, setLogOpen] = useState(false);

  const { data: logsData } = useQuery({
    queryKey: QUERY_KEYS.SLEEP,
    queryFn: () => sleepApi.getLogs({ days: 14 }).then((r) => r.data.data.logs),
  });

  const { data: insightsData } = useQuery({
    queryKey: QUERY_KEYS.SLEEP_INSIGHTS,
    queryFn: () => sleepApi.getInsights().then((r) => r.data.data),
  });

  const logs = logsData || [];
  const insights = insightsData?.insights || [];
  const stats = insightsData?.stats || {};

  // Last night's sleep
  const lastSleep = logs[0] || null;
  const avg7 = stats.avg7Minutes || 0;
  const diffFromAvg = lastSleep ? lastSleep.durationMinutes - avg7 : 0;
  const hitGoal = logs.filter((l) => l.durationMinutes >= SLEEP_GOAL).length;

  // Bar chart data (last 7 days)
  const last7 = stats.last7 || [];
  const chartData = last7.map((l) => ({
    label: format(new Date(l.date), 'EEE'),
    hours: parseFloat((l.durationMinutes / 60).toFixed(1)),
    quality: l.quality,
    isGoal: l.durationMinutes >= SLEEP_GOAL,
  })).reverse();

  const avgHours = parseFloat(((stats.avg7Minutes || 0) / 60).toFixed(1));

  return (
    <>
      <div
        className="px-4 pb-8"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          background: 'linear-gradient(180deg, #080d1a 0%, #0a0a0a 200px)',
          minHeight: '100%',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#d0d8ff]">Sleep</h1>
            <p className="text-[10px] text-[#4a5080] mt-0.5">Goal: 8h · Track every night</p>
          </div>
          <button
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6c63ff] text-white text-xs font-bold shadow-[0_0_12px_rgba(108,99,255,0.35)] touch-manipulation"
          >
            <Plus size={14} /> Log sleep
          </button>
        </div>

        {/* ── Last night card ── */}
        {lastSleep ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 mb-4"
            style={{ background: 'linear-gradient(135deg, #0d1225, #141830)', border: '1px solid #1e2440' }}
          >
            <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Moon size={10} /> Last night
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-[#d0d8ff] leading-none">
                  {fmtDuration(lastSleep.durationMinutes)}
                </p>
                <p className="text-[11px] text-[#6a70b0] mt-1">
                  {format(new Date(lastSleep.sleepTime), 'h:mm a')} → {format(new Date(lastSleep.wakeTime), 'h:mm a')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl">{SLEEP_QUALITY.find((q) => q.value === lastSleep.quality)?.emoji || '😐'}</p>
                <p className={cn(
                  'text-[10px] font-bold mt-1',
                  diffFromAvg >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]',
                )}>
                  {diffFromAvg >= 0 ? '+' : ''}{fmtDuration(Math.abs(diffFromAvg))} vs avg
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[9px] text-[#4a5080] mb-1.5">
                <span>0h</span>
                <span>Goal: 8h</span>
              </div>
              <div className="h-2 rounded-full bg-[#101828] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (lastSleep.durationMinutes / SLEEP_GOAL) * 100)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: lastSleep.durationMinutes >= SLEEP_GOAL
                      ? 'linear-gradient(90deg, #22c55e80, #22c55e)'
                      : lastSleep.durationMinutes >= SLEEP_GOAL * 0.75
                        ? 'linear-gradient(90deg, #f59e0b80, #f59e0b)'
                        : 'linear-gradient(90deg, #ef444480, #ef4444)',
                  }}
                />
              </div>
              <p className="text-[9px] text-[#4a5080] mt-1.5">
                Goal hit {hitGoal}/{Math.min(logs.length, 7)} nights this week
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-2xl p-6 mb-4 border border-[#1e2440] text-center"
            style={{ background: 'linear-gradient(135deg, #0d1225, #141830)' }}
          >
            <p className="text-3xl mb-2">🌙</p>
            <p className="text-sm font-semibold text-[#4a5080]">No sleep logged yet</p>
            <button
              onClick={() => setLogOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-[#6c63ff]/20 text-[#6c63ff] text-xs font-bold touch-manipulation"
            >
              Log last night
            </button>
          </div>
        )}

        {/* ── 7-day chart ── */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#0d1020', border: '1px solid #1e2040' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-widest">7-Day History</p>
              <p className="text-[10px] text-[#6a70b0]">avg {avgHours}h</p>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={chartData} barSize={24} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#4a5080' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#4a5080' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <ReferenceLine y={8} stroke="#6c63ff30" strokeDasharray="4 4" />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isGoal ? '#22c55e' : d.hours >= 6 ? '#f59e0b' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Insights ── */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-4"
            style={{ background: '#0d1020', border: '1px solid #1e2040' }}
          >
            <p className="text-[9px] font-bold text-[#4a5080] uppercase tracking-widest mb-3">Insights</p>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6c63ff] flex-shrink-0 mt-1.5" />
                  <p className="text-[11px] text-[#6a70b0] leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <LogSleepSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
