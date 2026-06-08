import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isToday, getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Bell } from 'lucide-react';
import { eventApi, notificationApi } from '@/api/index.js';
import { QUERY_KEYS, EVENT_TYPES } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';
import AddEventSheet from './components/AddEventSheet.jsx';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ── Request push notification permission ───────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  if (localStorage.getItem('notif-denied')) return false;

  const perm = await Notification.requestPermission();
  if (perm === 'denied') localStorage.setItem('notif-denied', '1');
  return perm === 'granted';
}

async function subscribeToPush() {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const vapidRes = await notificationApi.getVapidKey();
  const vapidKey = vapidRes.data.data.publicKey;
  if (!vapidKey) return;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await notificationApi.subscribe(existing.toJSON()).catch(() => {});
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  await notificationApi.subscribe(sub.toJSON());
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ── Event type color ──────────────────────────────────────────────────────────
function eventColor(event) {
  if (event.color) return event.color;
  return event.type === 'deadline' ? '#ef4444' : event.type === 'personal' ? '#22c55e' : '#6c63ff';
}

// ── Main: CalendarTab ─────────────────────────────────────────────────────────
export default function CalendarTab() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);

  // Request push permission on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && !localStorage.getItem('push-subscribed')) {
      subscribeToPush()
        .then(() => localStorage.setItem('push-subscribed', '1'))
        .catch(() => {});
    }
  }, []);

  // Fetch all events for this month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const { data: eventsData } = useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, format(currentMonth, 'yyyy-MM')],
    queryFn: () => eventApi.getAll({
      startDate: monthStart.toISOString(),
      endDate:   monthEnd.toISOString(),
    }).then((r) => r.data.data.events),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => eventApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
      toast.success('Event deleted');
    },
  });

  const events = eventsData || [];

  // Events for selected date
  const dayEvents = events.filter((ev) => isSameDay(new Date(ev.date), selectedDate))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Calendar grid
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Mon=0
  const prefixBlanks = Array.from({ length: startDayOfWeek });

  // Dot lookup by date string
  const dotMap = {};
  events.forEach((ev) => {
    const k = format(new Date(ev.date), 'yyyy-MM-dd');
    if (!dotMap[k]) dotMap[k] = [];
    dotMap[k].push(eventColor(ev));
  });

  return (
    <>
      <div
        className="px-4 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#f0f0f0]">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => subscribeToPush().then(() => toast.success('Notifications enabled'))}
              className="p-2 rounded-xl bg-[#111] border border-[#1e1e1e] text-[#444] hover:text-[#6c63ff] touch-manipulation"
            >
              <Bell size={16} />
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#6c63ff] text-white shadow-[0_0_12px_rgba(108,99,255,0.35)] touch-manipulation"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* ── Month header ── */}
        <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="p-2 rounded-xl hover:bg-[#1a1a1a] text-[#555] touch-manipulation"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-[#e0e0e0]">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-2 rounded-xl hover:bg-[#1a1a1a] text-[#555] touch-manipulation"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold text-[#333] uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {prefixBlanks.map((_, i) => <div key={`b${i}`} />)}
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dots = dotMap[dateKey] || [];
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-manipulation relative',
                    isSelected && 'bg-[#6c63ff]',
                    !isSelected && isTodayDay && 'bg-[#6c63ff]/15',
                    !isSelected && !isTodayDay && 'hover:bg-[#1a1a1a]',
                  )}
                >
                  <span className={cn(
                    'text-xs font-semibold leading-tight',
                    isSelected ? 'text-white' : isTodayDay ? 'text-[#6c63ff]' : 'text-[#888]',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {/* Dots */}
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="h-1 w-1 rounded-full flex-shrink-0"
                          style={{ background: isSelected ? 'white' : color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected day events ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-[#555] uppercase tracking-widest">
              {format(selectedDate, 'EEE, d MMM')}
            </h2>
            <button
              onClick={() => setAddOpen(true)}
              className="text-[10px] font-bold text-[#6c63ff] touch-manipulation"
            >
              + Add event
            </button>
          </div>

          {dayEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] py-8 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm font-semibold text-[#333]">No events</p>
              <p className="text-[10px] text-[#222] mt-1">Tap + to add one</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayEvents.map((ev) => {
                const typeConf = EVENT_TYPES.find((t) => t.value === ev.type);
                const color = eventColor(ev);
                return (
                  <motion.div
                    key={ev._id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl bg-[#111] border border-[#1e1e1e] overflow-hidden"
                  >
                    <div className="flex">
                      <div className="w-1 flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#e0e0e0] leading-tight truncate">{ev.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {ev.startTime && (
                                <span className="text-[10px] text-[#555]">
                                  {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                                </span>
                              )}
                              {ev.location && (
                                <span className="text-[10px] text-[#555]">📍 {ev.location}</span>
                              )}
                              {typeConf && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: `${color}18`, color }}
                                >
                                  {typeConf.icon} {typeConf.label}
                                </span>
                              )}
                            </div>
                            {ev.description && (
                              <p className="text-[10px] text-[#444] mt-1 line-clamp-2">{ev.description}</p>
                            )}
                            {ev.reminders?.length > 0 && (
                              <p className="text-[10px] text-[#6c63ff] mt-1">
                                🔔 {ev.reminders.length} reminder{ev.reminders.length > 1 ? 's' : ''} set
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteMutation.mutate(ev._id)}
                            className="p-2 rounded-xl text-[#333] hover:text-[#ef4444] hover:bg-[#ef4444]/8 touch-manipulation flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddEventSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </>
  );
}
