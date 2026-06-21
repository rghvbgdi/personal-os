import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { Plus, Bell, Check, Moon, Timer, ListChecks, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { todoDashboardApi, reviewApi, eventApi } from '@/api/index.js';
import { QUERY_KEYS, EVENT_TYPES } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import AddEventSheet from './components/AddEventSheet.jsx';
import PageLayout from '@/components/layout/PageLayout.jsx';

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

function EventRow({ event }) {
  const typeConf = EVENT_TYPES.find((t) => t.value === event.type) || EVENT_TYPES[0];
  const borderColor = event.type === 'deadline' ? '#ef4444'
    : event.type === 'personal' ? '#22c55e' : '#6c63ff';

  return (
    <div className="flex gap-3 items-start">
      <div className="w-12 flex-shrink-0 text-right">
        <p className="text-[10px] font-semibold text-[#555] leading-tight">{event.startTime || '—'}</p>
      </div>
      <div className="flex-shrink-0 w-0.5 self-stretch rounded-full mt-1" style={{ background: borderColor }} />
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e0e0e0] leading-tight truncate">{event.title}</p>
            {event.location && <p className="text-[10px] text-[#444] mt-0.5 truncate">{event.location}</p>}
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ background: `${borderColor}18`, color: borderColor }}
          >
            {typeConf.label}
          </span>
        </div>
        {event.description && (
          <p className="text-[10px] text-[#444] mt-1 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}

export default function TodayTab() {
  const { user } = useAuth();
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

  const [intention, setIntention] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);
  const intentionMutation = useMutation({
    mutationFn: () => reviewApi.upsert({ intention, date: todayStr }),
    onSuccess: () => setIntentionSaved(true),
  });

  const events    = eventsData || [];
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
    <PageLayout title="Today" subtitle={format(now, 'EEEE, d MMMM')}>
      <div className="pb-8">
        {/* Greeting */}
        <div className="mb-5 mt-2">
          <h1 className="text-xl font-bold text-[#f0f0f0] leading-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'Raghav'} 👋
          </h1>
        </div>

        {/* Daily intention */}
        <div className="mb-5">
          <div className="relative">
            <input
              value={intention || reviewData?.intention || ''}
              onChange={(e) => { setIntention(e.target.value); setIntentionSaved(false); }}
              onBlur={() => intention && intentionMutation.mutate()}
              placeholder="What's your #1 goal today?"
              className="w-full py-3 px-4 bg-[#111] border border-[#1e1e1e] rounded-2xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/50 transition-colors"
            />
            {intentionSaved && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22c55e]" />}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 mb-5" style={{ scrollbarWidth: 'none' }}>
          <StatCard icon={Calendar}   label="Next meeting" value={nextEvent ? `${nextEvent.title.slice(0, 14)}${nextEvent.title.length > 14 ? '…' : ''} ${nextEventLabel || ''}`.trim() : 'Nothing'} color="#f59e0b" />
          <StatCard icon={Moon}       label="Last sleep"   value={dash?.sleepLast ? fmtDuration(dash.sleepLast.durationMinutes) : 'Not logged'} color="#818cf8" />
          <StatCard icon={Timer}      label="Focus today"  value={fmtDuration(dash?.focusMinutes)} color="#22c55e" />
        </div>

        {/* Today's Schedule */}
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
                {events.map((ev) => <EventRow key={ev._id} event={ev} />)}
                <p className="text-[10px] text-[#333] text-center pt-2">— End of day —</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEventSheet open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </PageLayout>
  );
}
