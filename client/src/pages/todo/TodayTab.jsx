import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import {
  Plus, Bell, ChevronRight, Star, Check,
  Moon, Timer, ListChecks, Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import {
  todoDashboardApi, reviewApi, eventApi, taskApi,
} from '@/api/index.js';
import { QUERY_KEYS, EVENT_TYPES } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import { formatCurrency } from '@/utils/formatters.js';
import AddEventSheet from './components/AddEventSheet.jsx';

const now = new Date();

function greeting() {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtDuration(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
}

// ── Stat mini card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = '#6c63ff' }) {
  return (
    <div className="flex-shrink-0 w-[130px] rounded-2xl bg-[#111] border border-[#1e1e1e] p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#444]">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#e0e0e0] leading-tight">{value}</p>
    </div>
  );
}

// ── Timeline event row ─────────────────────────────────────────────────────────
function EventRow({ event, onReminder }) {
  const typeConf = EVENT_TYPES.find((t) => t.value === event.type) || EVENT_TYPES[6];
  const borderColor = event.type === 'deadline' ? '#ef4444'
    : event.type === 'personal' ? '#22c55e' : '#6c63ff';

  return (
    <div className="flex gap-3 items-start">
      {/* Time column */}
      <div className="w-12 flex-shrink-0 text-right">
        <p className="text-[10px] font-semibold text-[#555] leading-tight">
          {event.startTime || '—'}
        </p>
      </div>
      {/* Color bar */}
      <div className="flex-shrink-0 w-0.5 self-stretch rounded-full mt-1" style={{ background: borderColor }} />
      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e0e0e0] leading-tight truncate">{event.title}</p>
            {event.location && (
              <p className="text-[10px] text-[#444] mt-0.5 truncate">{event.location}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: `${borderColor}18`, color: borderColor }}
            >
              {typeConf.label}
            </span>
            <button
              onClick={() => onReminder(event)}
              className="p-1.5 rounded-lg text-[#333] hover:text-[#6c63ff] hover:bg-[#6c63ff]/10 transition-colors touch-manipulation"
            >
              <Bell size={13} />
            </button>
          </div>
        </div>
        {event.description && (
          <p className="text-[10px] text-[#444] mt-1 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Task row (quick complete) ──────────────────────────────────────────────────
function TaskRow({ task, onToggle }) {
  const priorityColors = { p1: '#ef4444', p2: '#f59e0b', p3: '#6c63ff', p4: '#6b7280' };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#111] last:border-0">
      <button
        onClick={() => onToggle(task._id)}
        className={cn(
          'h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation',
          task.isCompleted
            ? 'bg-[#22c55e] border-[#22c55e]'
            : 'border-[#333] hover:border-[#6c63ff]',
        )}
      >
        {task.isCompleted && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-tight truncate',
          task.isCompleted ? 'line-through text-[#444]' : 'text-[#e0e0e0]',
        )}>
          {task.title}
        </p>
        {task.dueTime && <p className="text-[10px] text-[#444] mt-0.5">Due {task.dueTime}</p>}
      </div>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] || '#6b7280' }} />
    </div>
  );
}

// ── EOD Review form (after 6pm) ────────────────────────────────────────────────
function ReviewForm({ onSave }) {
  const [accomplishments, setAccomplishments] = useState('');
  const [improvements, setImprovements] = useState('');
  const [dayRating, setDayRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => reviewApi.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW });
      setSaved(true);
    },
  });

  if (saved) {
    return (
      <div className="py-6 text-center">
        <p className="text-2xl mb-1">🌙</p>
        <p className="text-sm font-semibold text-[#22c55e]">Day reviewed. Rest well.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={accomplishments}
        onChange={(e) => setAccomplishments(e.target.value)}
        placeholder="What did you accomplish today?"
        rows={2}
        className="w-full px-3 py-2.5 text-sm bg-[#0d0d0d] border border-[#222] rounded-xl text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff] transition-colors resize-none"
      />
      <textarea
        value={improvements}
        onChange={(e) => setImprovements(e.target.value)}
        placeholder="What will you do differently tomorrow?"
        rows={2}
        className="w-full px-3 py-2.5 text-sm bg-[#0d0d0d] border border-[#222] rounded-xl text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff] transition-colors resize-none"
      />
      {/* Star rating */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[#444] mr-1">Rate your day</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setDayRating(n)}
            className="touch-manipulation"
          >
            <Star
              size={22}
              className={n <= dayRating ? 'text-[#f59e0b]' : 'text-[#252525]'}
              fill={n <= dayRating ? '#f59e0b' : 'none'}
            />
          </button>
        ))}
      </div>
      <button
        onClick={() => mutation.mutate({ accomplishments, improvements, dayRating })}
        disabled={mutation.isPending}
        className="w-full py-3 rounded-xl bg-[#6c63ff] text-white text-sm font-bold transition-opacity disabled:opacity-50 touch-manipulation"
      >
        Save review
      </button>
    </div>
  );
}

// ── Main: TodayTab ─────────────────────────────────────────────────────────────
export default function TodayTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addEventOpen, setAddEventOpen] = useState(false);
  const todayStr = format(now, 'yyyy-MM-dd');

  const { data: dash } = useQuery({
    queryKey: QUERY_KEYS.TODO_DASHBOARD,
    queryFn: () => todoDashboardApi.getToday().then((r) => r.data.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, todayStr],
    queryFn: () => eventApi.getAll({ startDate: `${todayStr}T00:00:00.000Z`, endDate: `${todayStr}T23:59:59.999Z` })
      .then((r) => r.data.data.events),
  });

  const { data: reviewData } = useQuery({
    queryKey: [...QUERY_KEYS.REVIEW, todayStr],
    queryFn: () => reviewApi.get({ date: todayStr }).then((r) => r.data.data.review),
  });

  const toggleTask = useMutation({
    mutationFn: (id) => taskApi.toggleComplete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
    },
  });

  // Intention save
  const [intention, setIntention] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);
  const intentionMutation = useMutation({
    mutationFn: () => reviewApi.upsert({ intention, date: todayStr }),
    onSuccess: () => setIntentionSaved(true),
  });

  const events = eventsData || [];
  const tasks  = dash?.tasksToday || [];
  const isEvening = now.getHours() >= 18;

  // Next event countdown
  const nextEvent = dash?.nextEvent;
  let nextEventLabel = null;
  if (nextEvent?.startTime) {
    const [h, m] = nextEvent.startTime.split(':').map(Number);
    const eventTime = new Date();
    eventTime.setHours(h, m, 0, 0);
    const diff = differenceInMinutes(eventTime, now);
    if (diff > 0 && diff < 180) nextEventLabel = `in ${diff}m`;
    else if (diff <= 0 && diff > -60) nextEventLabel = 'now';
    else nextEventLabel = nextEvent.startTime;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="px-4 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        {/* ── Header ── */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#f0f0f0] leading-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'Raghav'} 👋
          </h1>
          <p className="text-[11px] text-[#444] mt-0.5 font-medium">
            {format(now, 'EEEE, d MMMM')}
          </p>
          {dash?.internship && (
            <p className="text-[11px] text-[#6c63ff] mt-0.5 font-semibold">
              Day {Math.max(1, dash.internship.day)} of {dash.internship.total} at {dash.internship.companyName || 'Visa'}
            </p>
          )}
        </div>

        {/* ── Daily Intention ── */}
        <div className="mb-5">
          <div className="relative">
            <input
              value={intention || reviewData?.intention || ''}
              onChange={(e) => { setIntention(e.target.value); setIntentionSaved(false); }}
              onBlur={() => intention && intentionMutation.mutate()}
              placeholder="What's your #1 goal today?"
              className="w-full py-3 px-4 bg-[#111] border border-[#1e1e1e] rounded-2xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/50 transition-colors"
            />
            {intentionSaved && (
              <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22c55e]" />
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 mb-5" style={{ scrollbarWidth: 'none' }}>
          <StatCard icon={ListChecks} label="Tasks today"  value={`${tasks.length} tasks`}       color="#6c63ff" />
          <StatCard icon={Calendar}   label="Next meeting" value={nextEvent ? `${nextEvent.title.slice(0, 12)}${nextEvent.title.length > 12 ? '…' : ''} ${nextEventLabel || ''}` : 'Nothing'} color="#f59e0b" />
          <StatCard icon={Moon}       label="Last sleep"   value={dash?.sleepLast ? fmtDuration(dash.sleepLast.durationMinutes) : 'Not logged'} color="#818cf8" />
          <StatCard icon={Timer}      label="Focus today"  value={fmtDuration(dash?.focusMinutes)} color="#22c55e" />
        </div>

        {/* ── Today's Events ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-[#555] uppercase tracking-widest">Today's Schedule</h2>
            <button
              onClick={() => setAddEventOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-[#6c63ff] touch-manipulation"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4">
            {events.length === 0 ? (
              <p className="text-sm text-[#333] text-center py-4">No events scheduled today</p>
            ) : (
              <div>
                {events.map((ev) => (
                  <EventRow key={ev._id} event={ev} onReminder={() => {}} />
                ))}
                <p className="text-[10px] text-[#333] text-center pt-2">— No more events today —</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Today's Tasks ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-[#555] uppercase tracking-widest">Priority Tasks</h2>
            <button
              onClick={() => navigate('/todo/tasks')}
              className="flex items-center gap-1 text-[10px] font-bold text-[#6c63ff] touch-manipulation"
            >
              See all <ChevronRight size={12} />
            </button>
          </div>
          <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] px-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-[#333] text-center py-5">Nothing due today</p>
            ) : (
              tasks.map((task) => (
                <TaskRow key={task._id} task={task} onToggle={(id) => toggleTask.mutate(id)} />
              ))
            )}
          </div>
        </div>

        {/* ── EOD Review (after 6pm) ── */}
        {isEvening && (
          <div>
            <h2 className="text-xs font-bold text-[#555] uppercase tracking-widest mb-3">End of Day Review</h2>
            <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4">
              {reviewData?.dayRating ? (
                <div className="text-center py-4">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm font-semibold text-[#22c55e]">Review complete — {reviewData.dayRating}★</p>
                  <p className="text-[10px] text-[#444] mt-1 leading-relaxed">{reviewData.accomplishments}</p>
                </div>
              ) : (
                <ReviewForm />
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Event Sheet */}
      <AddEventSheet open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </>
  );
}
