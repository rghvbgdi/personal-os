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

const ORANGE = '#D97757';
const BG     = '#1C1917';
const SURF   = '#282320';
const SURF2  = '#312D2A';
const BORD   = '#403C39';
const MUTED  = '#78716C';
const SEC    = '#A8A29E';
const PRIM   = '#F5EDE0';

const PRIORITY_COLORS = {
  p1: '#ef4444',
  p2: '#f59e0b',
  p3: ORANGE,
  p4: MUTED,
};

const STATUS_COLORS = {
  todo: MUTED,
  inprogress: ORANGE,
  blocked: '#ef4444',
  done: '#4ade80',
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

  const handleTitleChange = (v) => {
    setTitle(v);
    if (v.toLowerCase().includes('meeting') && segment === 'work') setCategory('meeting-prep');
  };

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
            className="fixed inset-0 z-50 bg-black/70"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-[32px] overflow-hidden"
            style={{
              background: SURF,
              borderTop: `1px solid ${BORD}`,
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              maxHeight: '90dvh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: BORD }} />
            </div>

            <div className="px-6 pb-6">
              <h3 className="text-base font-bold mb-5" style={{ color: PRIM }}>New Task</h3>

              <input
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full py-4 px-4 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none mb-4"
                style={inputStyle}
              />

              <div className="flex gap-2 mb-4">
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 py-3 rounded-2xl text-[10px] font-bold border transition-all touch-manipulation',
                      priority === p.value ? 'text-white border-transparent' : 'border-transparent',
                    )}
                    style={{
                      background: priority === p.value ? PRIORITY_COLORS[p.value] : SURF2,
                      borderColor: priority === p.value ? PRIORITY_COLORS[p.value] : BORD,
                      color: priority === p.value ? '#fff' : MUTED,
                    }}
                  >
                    {p.value.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
                <input
                  type="time" value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={() => setShowMore(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold mb-4 touch-manipulation"
                style={{ color: MUTED }}
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
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                      style={inputStyle}
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>

                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                      style={inputStyle}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    <select
                      value={effort}
                      onChange={(e) => setEffort(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                      style={inputStyle}
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
                        className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none"
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject (DSA, OS, CN…)"
                        className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none"
                        style={inputStyle}
                      />
                    )}

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes…"
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none resize-none"
                      style={inputStyle}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={!title.trim() || mutation.isPending}
                onClick={() => mutation.mutate({
                  title, priority, status, category, segment,
                  dueDate: dueDate || undefined,
                  dueTime: dueTime || undefined,
                  projectTag, subject, notes, effortEstimate: effort,
                })}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-40 transition-opacity touch-manipulation"
                style={{ background: ORANGE }}
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
      className="rounded-3xl overflow-hidden"
      style={{
        background: task.status === 'blocked' ? `${SURF}` : SURF,
        border: `1px solid ${task.status === 'blocked' ? '#ef4444' + '40' : BORD}`,
        opacity: task.isCompleted ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
          style={{ background: PRIORITY_COLORS[task.priority] || MUTED, minHeight: 24 }}
        />

        <button
          onClick={() => onToggle(task._id)}
          className={cn(
            'mt-1 h-6 w-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation',
          )}
          style={{
            background: task.isCompleted ? ORANGE : 'transparent',
            borderColor: task.isCompleted ? ORANGE : MUTED,
          }}
        >
          {task.isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-base font-semibold leading-tight')}
            style={{ color: task.isCompleted ? MUTED : PRIM, textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.dueDate && (
              <span className="text-[11px] font-bold" style={{ color: SEC }}>
                {format(new Date(task.dueDate), 'MMM d')}{task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
            {cat && <span className="text-[11px] font-medium" style={{ color: SEC }}>{cat.icon} {cat.label}</span>}
            {task.projectTag && (
              <span className="text-[10px] px-2 py-1 rounded-md font-bold"
                style={{ background: `${ORANGE}15`, color: ORANGE }}>
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
              className="flex items-center gap-1 mt-2 text-[11px] font-medium touch-manipulation"
              style={{ color: MUTED }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {task.subTasks.filter((s) => s.isCompleted).length}/{task.subTasks.length} subtasks
            </button>
          )}
        </div>

        <button
          onClick={() => onDelete(task._id)}
          className="p-2 rounded-full transition-colors touch-manipulation flex-shrink-0"
          style={{ color: MUTED }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && task.subTasks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${BORD}` }}
          >
            <div className="px-5 py-3 space-y-2" style={{ background: SURF2 }}>
              {task.subTasks.map((st, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('h-4 w-4 rounded flex-shrink-0 border')}
                    style={{
                      background: st.isCompleted ? ORANGE : 'transparent',
                      borderColor: st.isCompleted ? ORANGE : BORD,
                    }} />
                  <span className="text-sm font-medium"
                    style={{ color: st.isCompleted ? MUTED : SEC, textDecoration: st.isCompleted ? 'line-through' : 'none' }}>
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
    <PageLayout>
      <div className="pb-8">

        {/* Page title + Add button */}
        <div className="flex items-center justify-between pt-1 mb-5">
          <h1 className="text-base font-semibold" style={{ color: PRIM }}>Tasks</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white touch-manipulation"
            style={{ background: ORANGE }}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Segment pills */}
        <div className="flex rounded-2xl overflow-hidden mb-5"
          style={{ border: `1px solid ${BORD}`, background: SURF2 }}>
          {[
            { value: 'work',    label: '💼 Work' },
            { value: 'student', label: '📚 Student' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSegment(value)}
              className="flex-1 py-3.5 text-[13px] font-bold transition-all duration-200 touch-manipulation border-r last:border-r-0"
              style={{
                background: segment === value ? ORANGE : 'transparent',
                color: segment === value ? '#fff' : MUTED,
                borderColor: BORD,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { value: 'all',     label: 'All' },
            { value: 'today',   label: 'Today' },
            { value: 'week',    label: 'This Week' },
            { value: 'overdue', label: 'Overdue' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation"
              style={{
                background: filter === value ? ORANGE : SURF,
                color: filter === value ? '#fff' : MUTED,
                borderColor: filter === value ? ORANGE : BORD,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl placeholder:text-[#544F4C] focus:outline-none transition-colors"
            style={{ background: SURF, border: `1px solid ${BORD}`, color: PRIM }}
          />
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-3xl animate-pulse" style={{ background: SURF, border: `1px solid ${BORD}` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">✨</p>
                <p className="text-base font-bold mb-1" style={{ color: PRIM }}>You're all caught up</p>
                <p className="text-sm" style={{ color: MUTED }}>Tap Add to create a task</p>
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

            {completed.length > 0 && (
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="flex items-center justify-center gap-2 mt-6 mb-3 text-xs font-bold w-full py-3 rounded-2xl touch-manipulation"
                style={{ background: SURF2, border: `1px solid ${BORD}`, color: MUTED }}
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
