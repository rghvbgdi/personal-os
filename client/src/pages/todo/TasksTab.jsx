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
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: '#111',
              borderTop: '1px solid #222',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-[#333]" />
            </div>

            <div className="px-5 pb-4">
              <h3 className="text-sm font-bold text-[#f0f0f0] mb-4">New Task</h3>

              {/* Title */}
              <input
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Task title…"
                className="w-full py-3 px-4 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60 transition-colors mb-3"
              />

              {/* Priority pills */}
              <div className="flex gap-2 mb-3">
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all touch-manipulation',
                      priority === p.value
                        ? 'text-white border-transparent'
                        : 'text-[#444] border-[#1e1e1e] hover:border-[#333]',
                    )}
                    style={priority === p.value ? { background: PRIORITY_COLORS[p.value] } : {}}
                  >
                    {p.value.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Quick date + time */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60 transition-colors"
                />
                <input
                  type="time" value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60 transition-colors"
                />
              </div>

              {/* More options toggle */}
              <button
                onClick={() => setShowMore(v => !v)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] mb-3 touch-manipulation"
              >
                {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showMore ? 'Less options' : 'More options'}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden mb-3"
                  >
                    {/* Category */}
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>

                    {/* Status */}
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* Effort */}
                    <select
                      value={effort}
                      onChange={(e) => setEffort(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] focus:outline-none focus:border-[#6c63ff]/60"
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
                        className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60"
                      />
                    ) : (
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject (DSA, OS, CN…)"
                        className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60"
                      />
                    )}

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes…"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-sm text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/60 resize-none"
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
                className="w-full py-3.5 rounded-xl bg-[#6c63ff] text-white text-sm font-bold disabled:opacity-40 transition-opacity touch-manipulation"
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
        'rounded-2xl bg-[#111] border overflow-hidden',
        task.status === 'blocked' ? 'border-[#ef4444]/25' : 'border-[#1e1e1e]',
        task.isCompleted && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Priority bar */}
        <div
          className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
          style={{ background: PRIORITY_COLORS[task.priority] || '#6b7280', minHeight: 20 }}
        />

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task._id)}
          className={cn(
            'mt-0.5 h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation',
            task.isCompleted ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#333] hover:border-[#6c63ff]',
          )}
        >
          {task.isCompleted && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold leading-tight',
            task.isCompleted ? 'line-through text-[#444]' : 'text-[#e0e0e0]',
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.dueDate && (
              <span className="text-[10px] text-[#444]">
                {format(new Date(task.dueDate), 'MMM d')}{task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
            {cat && <span className="text-[10px] text-[#444]">{cat.icon} {cat.label}</span>}
            {task.projectTag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#6c63ff]/10 text-[#6c63ff] font-bold">
                {task.projectTag}
              </span>
            )}
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
              style={{ background: `${STATUS_COLORS[task.status]}18`, color: STATUS_COLORS[task.status] }}
            >
              {TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status}
            </span>
          </div>
          {task.subTasks?.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-[#444] touch-manipulation"
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {task.subTasks.filter((s) => s.isCompleted).length}/{task.subTasks.length} subtasks
            </button>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task._id)}
          className="p-2 rounded-xl text-[#333] hover:text-[#ef4444] hover:bg-[#ef4444]/8 transition-colors touch-manipulation flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Subtasks expanded */}
      <AnimatePresence>
        {expanded && task.subTasks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[#1a1a1a]"
          >
            <div className="px-4 py-2 bg-[#0d0d0d] space-y-1.5">
              {task.subTasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    'h-3 w-3 rounded flex-shrink-0 border',
                    st.isCompleted ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#333]',
                  )} />
                  <span className={cn('text-xs', st.isCompleted ? 'line-through text-[#333]' : 'text-[#888]')}>
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
    <>
      <div
        className="px-4 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#f0f0f0]">Tasks</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#6c63ff] text-white shadow-[0_0_12px_rgba(108,99,255,0.35)] touch-manipulation"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* ── Segment pills ── */}
        <div className="flex rounded-2xl border border-[#1e1e1e] overflow-hidden bg-[#0d0d0d] mb-4">
          {[
            { value: 'work', label: '💼 Work' },
            { value: 'student', label: '📚 Student' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSegment(value)}
              className={cn(
                'flex-1 py-3 text-xs font-bold transition-all duration-200 touch-manipulation border-r last:border-r-0 border-[#1e1e1e]',
                segment === value ? 'bg-[#6c63ff] text-white' : 'text-[#444]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Filter pills ── */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
                'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all touch-manipulation',
                filter === value
                  ? 'bg-[#6c63ff] text-white border-[#6c63ff]'
                  : 'bg-[#0d0d0d] text-[#444] border-[#1e1e1e]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-4 py-2.5 text-sm bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl text-[#ccc] placeholder:text-[#333] focus:outline-none focus:border-[#6c63ff]/50 transition-colors"
          />
        </div>

        {/* ── Task list ── */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#111] border border-[#1e1e1e] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {active.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm font-semibold text-[#333]">No active tasks</p>
                <p className="text-[11px] text-[#222] mt-1">Tap + to add one</p>
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
                className="flex items-center gap-2 mt-3 text-[10px] font-bold text-[#333] touch-manipulation w-full"
              >
                {showCompleted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {completed.length} completed
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
    </>
  );
}
