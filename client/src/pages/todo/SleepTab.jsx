import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { Moon, Plus, Pencil, Trash2 } from 'lucide-react';
import { sleepApi } from '@/api/index.js';
import { QUERY_KEYS, SLEEP_QUALITY } from '@/constants/index.js';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';
import PageLayout from '@/components/layout/PageLayout.jsx';

const ORANGE = '#D97757';
const BG     = '#1C1917';
const SURF   = '#282320';
const SURF2  = '#312D2A';
const BORD   = '#403C39';
const MUTED  = '#78716C';
const SEC    = '#A8A29E';
const PRIM   = '#F5EDE0';

const SLEEP_GOAL = 8 * 60;

function fmtDuration(mins) {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

// ── Log / Edit Sleep Sheet ────────────────────────────────────────────────────
function LogSleepSheet({ open, onClose, editLog = null }) {
  const qc = useQueryClient();
  const yesterday = subDays(new Date(), 1);
  const [sleepDate, setSleepDate] = useState(
    editLog ? format(new Date(editLog.sleepTime), 'yyyy-MM-dd') : format(yesterday, 'yyyy-MM-dd')
  );
  const [sleepTime, setSleepTime] = useState(
    editLog ? format(new Date(editLog.sleepTime), 'HH:mm') : '23:00'
  );
  const [wakeDate, setWakeDate] = useState(
    editLog ? format(new Date(editLog.wakeTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [wakeTime, setWakeTime] = useState(
    editLog ? format(new Date(editLog.wakeTime), 'HH:mm') : '07:00'
  );
  const [quality, setQuality] = useState(editLog?.quality ?? 3);
  const [notes, setNotes]     = useState(editLog?.notes ?? '');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP_INSIGHTS });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
  };

  const logMutation = useMutation({
    mutationFn: (data) => sleepApi.log(data),
    onSuccess: () => { invalidate(); toast.success('Sleep logged'); onClose(); },
  });
  const editMutation = useMutation({
    mutationFn: (data) => sleepApi.update(editLog._id, data),
    onSuccess: () => { invalidate(); toast.success('Updated'); onClose(); },
  });

  const handleSave = () => {
    const sleepDateTime = `${sleepDate}T${sleepTime}:00`;
    const wakeDateTime  = `${wakeDate}T${wakeTime}:00`;
    if (new Date(wakeDateTime) <= new Date(sleepDateTime)) return toast.error('Wake time must be after sleep time');
    const payload = { sleepTime: sleepDateTime, wakeTime: wakeDateTime, quality, notes };
    editLog ? editMutation.mutate(payload) : logMutation.mutate(payload);
  };

  const isPending = logMutation.isPending || editMutation.isPending;

  const inputStyle = {
    background: SURF2,
    border: `1px solid ${BORD}`,
    color: PRIM,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70" style={{ backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl"
            style={{ background: SURF, borderTop: `1px solid ${BORD}`, maxHeight: '85dvh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full" style={{ background: BORD }} />
            </div>
            <div className="px-5 pb-8">
              <h3 className="text-sm font-bold mb-5" style={{ color: PRIM }}>{editLog ? 'Edit Sleep' : 'Log Sleep'}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>I fell asleep</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>I woke up</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={wakeDate} onChange={(e) => setWakeDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>Sleep quality</p>
                  <div className="flex gap-2">
                    {SLEEP_QUALITY.map((q) => (
                      <button key={q.value} onClick={() => setQuality(q.value)}
                        className={cn('flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all touch-manipulation')}
                        style={{
                          background: quality === q.value ? `${ORANGE}15` : SURF2,
                          borderColor: quality === q.value ? ORANGE : BORD,
                        }}
                      >
                        <span className="text-lg">{q.emoji}</span>
                        <span className="text-[8px] font-bold" style={{ color: quality === q.value ? ORANGE : MUTED }}>
                          {q.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ ...inputStyle, '::placeholder': { color: MUTED } }}
                />
                <button onClick={handleSave} disabled={isPending}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 touch-manipulation"
                  style={{ background: ORANGE }}
                >
                  {isPending ? 'Saving…' : editLog ? 'Update Sleep' : 'Log Sleep'}
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
  const qc = useQueryClient();
  const [logOpen, setLogOpen]   = useState(false);
  const [editLog, setEditLog]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: logsData } = useQuery({
    queryKey: QUERY_KEYS.SLEEP,
    queryFn: () => sleepApi.getLogs({ days: 14 }).then((r) => r.data.data.logs),
  });

  const { data: insightsData } = useQuery({
    queryKey: QUERY_KEYS.SLEEP_INSIGHTS,
    queryFn: () => sleepApi.getInsights().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sleepApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SLEEP_INSIGHTS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
      toast.success('Deleted');
      setDeleteId(null);
    },
  });

  const logs      = logsData || [];
  const stats     = insightsData?.stats || {};
  const insights  = insightsData?.insights || [];
  const lastSleep = logs[0] || null;
  const avg7      = stats.avg7Minutes || 0;
  const diffFromAvg = lastSleep ? lastSleep.durationMinutes - avg7 : 0;
  const hitGoal   = logs.filter((l) => l.durationMinutes >= SLEEP_GOAL).length;

  const last7 = stats.last7 || [];
  const chartData = last7.map((l) => ({
    label: format(new Date(l.date), 'EEE'),
    hours: parseFloat((l.durationMinutes / 60).toFixed(1)),
    isGoal: l.durationMinutes >= SLEEP_GOAL,
  })).reverse();

  const avgHours = parseFloat(((stats.avg7Minutes || 0) / 60).toFixed(1));

  const openEdit   = (log) => { setEditLog(log); setLogOpen(true); };
  const closeSheet = () => { setLogOpen(false); setEditLog(null); };

  return (
    <PageLayout>
      <div className="pb-8">

        {/* Page title + Log button */}
        <div className="flex items-center justify-between pt-1 mb-5">
          <h1 className="text-base font-semibold" style={{ color: PRIM }}>Sleep</h1>
          <button
            onClick={() => { setEditLog(null); setLogOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white touch-manipulation"
            style={{ background: ORANGE }}
          >
            <Plus size={13} /> Log
          </button>
        </div>

        {/* Last night card */}
        {lastSleep ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 mb-5"
            style={{ background: `linear-gradient(135deg, ${SURF}, ${SURF2})`, border: `1px solid ${BORD}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: MUTED }}>
              <Moon size={12} /> Last night
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-black leading-none mb-1" style={{ color: PRIM }}>{fmtDuration(lastSleep.durationMinutes)}</p>
                <p className="text-xs font-medium" style={{ color: SEC }}>
                  {format(new Date(lastSleep.sleepTime), 'h:mm a')} → {format(new Date(lastSleep.wakeTime), 'h:mm a')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl mb-1">{SLEEP_QUALITY.find((q) => q.value === lastSleep.quality)?.emoji || '😐'}</p>
                <p className={cn('text-[11px] font-bold', diffFromAvg >= 0 ? 'text-[#D97757]' : 'text-[#ef4444]')}>
                  {diffFromAvg >= 0 ? '+' : ''}{fmtDuration(Math.abs(diffFromAvg))} vs avg
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                <span>0h</span><span>Goal: 8h</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: SURF2 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (lastSleep.durationMinutes / SLEEP_GOAL) * 100)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: lastSleep.durationMinutes >= SLEEP_GOAL
                      ? `linear-gradient(90deg, ${ORANGE}80, ${ORANGE})`
                      : lastSleep.durationMinutes >= SLEEP_GOAL * 0.75
                        ? 'linear-gradient(90deg, #f59e0b80, #f59e0b)'
                        : 'linear-gradient(90deg, #ef444480, #ef4444)',
                  }}
                />
              </div>
              <p className="text-xs font-medium mt-3" style={{ color: MUTED }}>
                Goal hit {hitGoal}/{Math.min(logs.length, 7)} nights this week
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-3xl p-8 mb-5 text-center"
            style={{ background: `linear-gradient(135deg, ${SURF}, ${SURF2})`, border: `1px solid ${BORD}` }}
          >
            <p className="text-4xl mb-3">🌙</p>
            <p className="text-base font-semibold" style={{ color: MUTED }}>No sleep logged yet</p>
            <button onClick={() => setLogOpen(true)}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold touch-manipulation"
              style={{ background: `${ORANGE}20`, color: ORANGE }}
            >
              Log last night
            </button>
          </div>
        )}

        {/* 7-day chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-3xl p-5 mb-5" style={{ background: SURF, border: `1px solid ${BORD}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>7-Day History</p>
              <p className="text-xs font-bold" style={{ color: SEC }}>avg {avgHours}h</p>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED, fontWeight: 'bold' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <ReferenceLine y={8} stroke={`${ORANGE}30`} strokeDasharray="4 4" />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isGoal ? ORANGE : d.hours >= 6 ? '#f59e0b' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* History with edit / delete */}
        {logs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-3xl p-5 mb-5" style={{ background: SURF, border: `1px solid ${BORD}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: MUTED }}>All Logs</p>
            <div className="space-y-0">
              {logs.map((log) => {
                const qualConf = SLEEP_QUALITY.find((q) => q.value === log.quality);
                return (
                  <div key={log._id} className="flex items-center gap-3 py-3 last:border-0"
                    style={{ borderBottom: `1px solid ${BORD}` }}>
                    <span className="text-xl flex-shrink-0">{qualConf?.emoji || '😐'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: PRIM }}>{fmtDuration(log.durationMinutes)}</p>
                      <p className="text-[10px]" style={{ color: MUTED }}>
                        {format(new Date(log.sleepTime), 'MMM d')} · {format(new Date(log.sleepTime), 'h:mm a')} → {format(new Date(log.wakeTime), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(log)}
                        className="p-2 rounded-xl transition-colors touch-manipulation"
                        style={{ color: MUTED }}
                        onMouseEnter={e => e.currentTarget.style.color = ORANGE}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}
                      >
                        <Pencil size={14} />
                      </button>
                      {deleteId === log._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteMutation.mutate(log._id)}
                            className="px-2 py-1 rounded-lg bg-[#ef4444] text-white text-[10px] font-bold touch-manipulation"
                          >
                            Delete
                          </button>
                          <button onClick={() => setDeleteId(null)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold touch-manipulation"
                            style={{ background: SURF2, color: SEC }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(log._id)}
                          className="p-2 rounded-xl transition-colors touch-manipulation"
                          style={{ color: MUTED }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>

      <LogSleepSheet open={logOpen} onClose={closeSheet} editLog={editLog} />
    </PageLayout>
  );
}
