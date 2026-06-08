import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { addMinutes, format } from 'date-fns';
import { X, Plus, Trash2 } from 'lucide-react';
import { eventApi } from '@/api/index.js';
import { QUERY_KEYS, EVENT_TYPES } from '@/constants/index.js';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn.js';

const PRESET_COLORS = ['#6c63ff', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899'];
const REMINDER_OPTIONS = [
  { label: 'At event time', value: 0 },
  { label: '5 min before',  value: 5 },
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hr before',   value: 60 },
  { label: '1 day before',  value: 1440 },
];

function computeReminderTime(date, startTime, minutesBefore) {
  const [h, m] = (startTime || '09:00').split(':').map(Number);
  const eventDateTime = new Date(date);
  eventDateTime.setHours(h, m, 0, 0);
  return addMinutes(eventDateTime, -minutesBefore).toISOString();
}

export default function AddEventSheet({ open, onClose, defaultDate }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('meeting');
  const [date, setDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6c63ff');
  const [reminders, setReminders] = useState([15]);
  const [repeat, setRepeat] = useState('none');

  const mutation = useMutation({
    mutationFn: (data) => eventApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TODO_DASHBOARD });
      toast.success('Event created');
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle(''); setType('meeting'); setStartTime('09:00'); setEndTime('10:00');
    setLocation(''); setDescription(''); setColor('#6c63ff'); setReminders([15]); setRepeat('none');
  };

  const addReminder = () => setReminders((r) => [...r, 15]);
  const removeReminder = (i) => setReminders((r) => r.filter((_, idx) => idx !== i));
  const updateReminder = (i, v) => setReminders((r) => r.map((x, idx) => idx === i ? v : x));

  const handleSave = () => {
    if (!title.trim()) return toast.error('Title required');
    const computedReminders = reminders.map((mins) => ({
      minutesBefore: mins,
      triggerTime: computeReminderTime(date, startTime, mins),
    }));
    mutation.mutate({
      title, type, date, startTime, endTime,
      location, description, color, repeat,
      reminders: computedReminders,
    });
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
              background: '#111',
              borderTop: '1px solid #1e1e1e',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight: '92dvh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-[#333]" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-sm font-bold text-[#f0f0f0]">New Event</h3>
              <button onClick={onClose} className="p-2 text-[#444] hover:text-[#ccc] touch-manipulation">
                <X size={17} />
              </button>
            </div>

            <div className="px-5 space-y-4 pb-2">
              {/* Title */}
              <input
                autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title…"
                className="w-full py-3 px-4 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60"
              />

              {/* Type pills */}
              <div className="grid grid-cols-4 gap-2">
                {EVENT_TYPES.slice(0, 4).map((t) => (
                  <button
                    key={t.value} onClick={() => setType(t.value)}
                    className={cn(
                      'py-2 rounded-xl text-[9px] font-bold border transition-all touch-manipulation text-center',
                      type === t.value ? 'bg-[#6c63ff] text-white border-[#6c63ff]' : 'text-[#444] border-[#1e1e1e]',
                    )}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Date + Times */}
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1">Start</p>
                  <input
                    type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1">End</p>
                  <input
                    type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
                  />
                </div>
              </div>

              {/* Location */}
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (Zoom, Room B…)"
                className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60"
              />

              {/* Description */}
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60 resize-none"
              />

              {/* Color */}
              <div>
                <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-2">Color</p>
                <div className="flex gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c} onClick={() => setColor(c)}
                      className={cn(
                        'h-7 w-7 rounded-full flex-shrink-0 transition-all touch-manipulation',
                        color === c && 'ring-2 ring-white ring-offset-2 ring-offset-[#111]',
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold text-[#444] uppercase tracking-wider">Reminders</p>
                  <button onClick={addReminder} className="flex items-center gap-1 text-[10px] text-[#6c63ff] font-bold touch-manipulation">
                    <Plus size={10} /> Add
                  </button>
                </div>
                {reminders.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select
                      value={r}
                      onChange={(e) => updateReminder(i, Number(e.target.value))}
                      className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button onClick={() => removeReminder(i)} className="p-2 text-[#333] hover:text-[#ef4444] touch-manipulation">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Repeat */}
              <select
                value={repeat} onChange={(e) => setRepeat(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
              >
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays only</option>
              </select>

              {/* Save */}
              <button
                disabled={!title.trim() || mutation.isPending}
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-[#6c63ff] text-white text-sm font-bold disabled:opacity-40 transition-opacity touch-manipulation"
              >
                {mutation.isPending ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
