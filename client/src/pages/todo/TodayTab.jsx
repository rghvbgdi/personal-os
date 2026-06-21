import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Check, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { taskApi, eventApi } from '@/api/index.js';
import { QUERY_KEYS, EVENT_TYPES, TASK_PRIORITIES } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import PageLayout from '@/components/layout/PageLayout.jsx';
import toast from 'react-hot-toast';

const ORANGE = '#D97757';
const SURF   = '#282320';
const SURF2  = '#312D2A';
const BORD   = '#403C39';
const MUTED  = '#78716C';
const SEC    = '#A8A29E';
const PRIM   = '#F5EDE0';

const PRIORITY_COLORS = { p1: '#ef4444', p2: '#f59e0b', p3: ORANGE, p4: MUTED };

const now = new Date();
function greeting() {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function TodayTaskRow({ task, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2.5 group" style={{ borderBottom: `1px solid ${BORD}` }}>
      <div className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ background: PRIORITY_COLORS[task.priority] || MUTED, minWidth: 3 }} />
      <button
        onClick={() => onToggle(task._id)}
        className="h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation"
        style={{
          background: task.isCompleted ? ORANGE : 'transparent',
          borderColor: task.isCompleted ? ORANGE : MUTED,
        }}
      >
        {task.isCompleted && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight"
          style={{
            color: task.isCompleted ? MUTED : PRIM,
            textDecoration: task.isCompleted ? 'line-through' : 'none',
          }}>
          {task.title}
        </p>
        {task.dueTime && (
          <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{task.dueTime}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(task._id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all touch-manipulation flex-shrink-0"
        style={{ color: MUTED }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function EventRow({ event }) {
  const typeConf = EVENT_TYPES.find((t) => t.value === event.type) || EVENT_TYPES[0];
  const color = event.type === 'deadline' ? '#ef4444' : event.type === 'personal' ? ORANGE : SEC;
  return (
    <div className="flex gap-3 items-start py-2.5" style={{ borderBottom: `1px solid ${BORD}` }}>
      <span className="text-[10px] font-semibold w-10 flex-shrink-0 text-right pt-0.5" style={{ color: MUTED }}>
        {event.startTime || '—'}
      </span>
      <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate" style={{ color: PRIM }}>{event.title}</p>
        {event.location && <p className="text-[10px] mt-0.5 truncate" style={{ color: MUTED }}>{event.location}</p>}
      </div>
    </div>
  );
}

export default function TodayTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [quickTitle, setQuickTitle] = useState('');
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef(null);
  const todayStr = format(now, 'yyyy-MM-dd');

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: QUERY_KEYS.TASKS_TODAY,
    queryFn: () => taskApi.getToday().then((r) => r.data.data.tasks),
  });

  const { data: eventsData } = useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, todayStr],
    queryFn: () => eventApi.getAll({
      startDate: `${todayStr}T00:00:00.000Z`,
      endDate: `${todayStr}T23:59:59.999Z`,
    }).then((r) => r.data.data.events),
  });

  const invalidateTasks = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
  };

  const quickAddMutation = useMutation({
    mutationFn: (title) => taskApi.create({
      title,
      priority: 'p3',
      status: 'todo',
      category: 'other',
      segment: 'work',
      dueDate: todayStr,
    }),
    onSuccess: () => { invalidateTasks(); setQuickTitle(''); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => taskApi.toggleComplete(id),
    onSuccess: invalidateTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => { invalidateTasks(); toast.success('Deleted'); },
  });

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickAddMutation.mutate(quickTitle.trim());
  };

  const tasks  = tasksData || [];
  const active = tasks.filter((t) => !t.isCompleted);
  const done   = tasks.filter((t) => t.isCompleted);
  const events = eventsData || [];

  return (
    <PageLayout>
      <div className="pb-8">

        {/* Greeting */}
        <div className="pt-1 mb-6">
          <h1 className="text-xl font-bold leading-tight" style={{ color: PRIM }}>
            Good {greeting()}, {user?.name?.split(' ')[0] || 'Raghav'} 👋
          </h1>
          <p className="text-xs mt-1" style={{ color: MUTED }}>{format(now, 'EEEE, d MMMM')}</p>
        </div>

        {/* Today's tasks */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Today</h2>
            {active.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${ORANGE}15`, color: ORANGE }}>
                {active.length} left
              </span>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            {/* Quick add */}
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORD}` }}>
              <Plus size={14} style={{ color: ORANGE }} className="flex-shrink-0" />
              <input
                ref={inputRef}
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Add a task for today…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#544F4C]"
                style={{ color: PRIM }}
              />
              {quickTitle && (
                <button type="submit" className="text-[10px] font-bold px-2 py-1 rounded-lg touch-manipulation"
                  style={{ background: ORANGE, color: '#fff' }}>
                  Add
                </button>
              )}
            </form>

            {/* Task list */}
            {tasksLoading ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: MUTED }}>Loading…</div>
            ) : active.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-sm font-medium" style={{ color: MUTED }}>All done for today</p>
              </div>
            ) : (
              <div className="px-4">
                {active.map((task) => (
                  <TodayTaskRow
                    key={task._id}
                    task={task}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}

            {/* Completed toggle */}
            {done.length > 0 && (
              <>
                <button
                  onClick={() => setShowDone(v => !v)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-semibold touch-manipulation"
                  style={{ borderTop: `1px solid ${BORD}`, color: MUTED }}
                >
                  {showDone ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {done.length} completed
                </button>
                {showDone && (
                  <div className="px-4">
                    {done.map((task) => (
                      <TodayTaskRow
                        key={task._id}
                        task={task}
                        onToggle={(id) => toggleMutation.mutate(id)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Today's schedule */}
        {events.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
              <Calendar size={10} className="inline mr-1.5" />Schedule
            </h2>
            <div className="rounded-2xl px-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              {events.map((ev) => <EventRow key={ev._id} event={ev} />)}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
