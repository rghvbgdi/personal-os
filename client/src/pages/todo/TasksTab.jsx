import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { format } from 'date-fns';
import { taskApi } from '@/api/index.js';
import {
  QUERY_KEYS, TASK_PRIORITIES, TASK_STATUSES,
  WORK_CATEGORIES, STUDENT_CATEGORIES, EFFORT_OPTIONS,
} from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';
import PageLayout from '@/components/layout/PageLayout.jsx';

const PRIORITY_COLORS = {
  p1: '#ef4444', p2: '#f59e0b', p3: '#6c63ff', p4: '#6b7280',
};
const STATUS_COLORS = {
  todo: '#6b7280', inprogress: '#6c63ff', blocked: '#ef4444', done: '#22c55e',
};

// ── Add Task Sheet ─────────────────────────────────────────────────────────────
function AddTaskSheet({ open, onClose, segment }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('p3');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState('other');
  const [status, setStatus] = useState('todo');
  const [projectTag, setProjectTag] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState('');
  const [showMore, setShowMore] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
      toast.success('Task added');
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle(''); setPriority('p3'); setDueDate(''); setDueTime('');
    setCategory('other'); setStatus('todo'); setProjectTag('');
    setSubject(''); setNotes(''); setEffort(''); setShowMore(false);
  };

  const categories = segment === 'work' ? WORK_CATEGORIES : STUDENT_CATEGORIES;

  // Auto-detect meeting in title
  const handleTitleChange = (v) => {
    setTitle(v);
    if (v.toLowerCase().includes('meeting') && segment === 'work') setCategory('meeting-prep');
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
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-[32px] overflow-hidden"
            style={{
              background: '#0a0a0a',
              borderTop: '1px solid #1a1a1a',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-zinc-800" />
            </div>

            <div className="px-6 pb-6">
              <h3 className="text-lg font-bold text-white mb-6">New Task</h3>

              {/* Title */}
              <input
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full py-4 px-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors mb-4"
              />

              {/* Priority pills */}
              <div className="flex gap-2 mb-4">
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 py-3 rounded-2xl text-[10px] font-bold border transition-all touch-manipulation',
                      priority === p.value
                        ? 'text-white border-transparent'
                        : 'text-zinc-500 border-zinc-800 hover:border-zinc-700',
                    )}
                    style={priority === p.value ? { background: PRIORITY_COLORS[p.value] } : {}}
                  >
                    {p.value.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Quick date + time */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
                <input
                  type="time" value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              {/* More options toggle */}
              <button
                onClick={() => setShowMore(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mb-4 touch-manipulation"
              >
                {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMore ? 'Less options' : 'More options'}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden mb-4"
                  >
                    {/* Category */}
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/60"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>

                    {/* Status */}
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/60"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* Effort */}
                    <select
                      value={effort}
                      onChange={(e) => setEffort(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/60"
                    >
                      <option value="">Effort estimate</option>
                      {EFFORT_OPTIONS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>

                    {segment === 'work' ? (
                      <input
                        value={projectTag}
                        onChange={(e) => setProjectTag(e.target.value)}
                        placeholder="Sprint / Project tag"
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60"
                      />
                    ) : (
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject (DSA, OS, CN…)"
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60"
                      />
                    )}

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes…"
                      rows={2}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                disabled={!title.trim() || mutation.isPending}
                onClick={() => mutation.mutate({
                  title, priority, status, category, segment,
                  dueDate: dueDate || undefined,
                  dueTime: dueTime || undefined,
                  projectTag, subject, notes, effortEstimate: effort,
                })}
                className="w-full py-4 rounded-2xl bg-indigo-500 text-white text-sm font-bold disabled:opacity-40 transition-opacity touch-manipulation"
              >
                Add Task
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const categories = [...WORK_CATEGORIES, ...STUDENT_CATEGORIES];
  const cat = categories.find((c) => c.value === task.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-3xl bg-zinc-900/50 border overflow-hidden',
        task.status === 'blocked' ? 'border-rose-500/25' : 'border-zinc-800',
        task.isCompleted && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Priority bar */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
          style={{ background: PRIORITY_COLORS[task.priority] || '#6b7280', minHeight: 24 }}
        />

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task._id)}
          className={cn(
            'mt-1 h-6 w-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation',
            task.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-indigo-500',
          )}
        >
          {task.isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-base font-semibold leading-tight',
            task.isCompleted ? 'line-through text-zinc-500' : 'text-white',
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.dueDate && (
              <span className="text-[11px] font-bold text-zinc-400">
                {format(new Date(task.dueDate), 'MMM d')}{task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
            {cat && <span className="text-[11px] font-medium text-zinc-400">{cat.icon} {cat.label}</span>}
            {task.projectTag && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold">
                {task.projectTag}
              </span>
            )}
            <span
              className="text-[10px] px-2 py-1 rounded-md font-bold"
              style={{ background: `${STATUS_COLORS[task.status]}18`, color: STATUS_COLORS[task.status] }}
            >
              {TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status}
            </span>
          </div>
          {task.subTasks?.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-2 text-[11px] font-medium text-zinc-500 touch-manipulation"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {task.subTasks.filter((s) => s.isCompleted).length}/{task.subTasks.length} subtasks
            </button>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task._id)}
          className="p-2 rounded-full text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors touch-manipulation flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Subtasks expanded */}
      <AnimatePresence>
        {expanded && task.subTasks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-zinc-800"
          >
            <div className="px-5 py-3 bg-zinc-950 space-y-2">
              {task.subTasks.map((st, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    'h-4 w-4 rounded flex-shrink-0 border',
                    st.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700',
                  )} />
                  <span className={cn('text-sm font-medium', st.isCompleted ? 'line-through text-zinc-600' : 'text-zinc-400')}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main: TasksTab ─────────────────────────────────────────────────────────────
export default function TasksTab() {
  const qc = useQueryClient();
  const [segment, setSegment] = useState('work');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.TASKS, segment, filter, search],
    queryFn: () => taskApi.getAll({ segment, filter: filter !== 'all' ? filter : undefined, search: search || undefined })
      .then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => taskApi.toggleComplete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      toast.success('Task deleted');
    },
  });

  const tasks     = data?.data || [];
  const active    = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

  return (
    <PageLayout
      title="Tasks"
      subtitle="Manage your to-dos."
      actions={
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-white shadow-lg touch-manipulation"
        >
          <Plus size={16} />
        </button>
      }
    >
      <div className="pb-8">
        {/* ── Segment pills ── */}
        <div className="flex rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50 mb-5">
          {[
            { value: 'work', label: '💼 Work' },
            { value: 'student', label: '📚 Student' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSegment(value)}
              className={cn(
                'flex-1 py-3.5 text-[13px] font-bold transition-all duration-200 touch-manipulation border-r last:border-r-0 border-zinc-800',
                segment === value ? 'bg-indigo-500 text-white' : 'text-zinc-500',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Filter pills ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'overdue', label: 'Overdue' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation',
                filter === value
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* ── Task list ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">✨</p>
                <p className="text-base font-bold text-white mb-1">You're all caught up</p>
                <p className="text-sm text-zinc-500">Tap + to add a new task</p>
              </div>
            )}
            {active.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={(id) => toggleMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}

            {/* Completed section */}
            {completed.length > 0 && (
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="flex items-center justify-center gap-2 mt-6 mb-3 text-xs font-bold text-zinc-500 touch-manipulation w-full bg-zinc-900/30 py-3 rounded-2xl border border-zinc-800/50"
              >
                {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {completed.length} Completed
              </button>
            )}
            {showCompleted && completed.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={(id) => toggleMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskSheet open={addOpen} onClose={() => setAddOpen(false)} segment={segment} />
    </PageLayout>
  );
}
