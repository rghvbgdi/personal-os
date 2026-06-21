import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Pencil, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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
const SURF   = '#282320';
const SURF2  = '#312D2A';
const BORD   = '#403C39';
const MUTED  = '#78716C';
const SEC    = '#A8A29E';
const PRIM   = '#F5EDE0';

const PRIORITY_COLORS = { p1: '#ef4444', p2: '#f59e0b', p3: ORANGE, p4: MUTED };
const STATUS_COLORS   = { todo: MUTED, inprogress: ORANGE, blocked: '#ef4444', done: '#4ade80' };

// ── Add / Edit Task Sheet ──────────────────────────────────────────────────────
function TaskSheet({ open, onClose, segment, editTask = null }) {
  const qc = useQueryClient();
  const isEdit = !!editTask;

  const [title, setTitle]         = useState('');
  const [priority, setPriority]   = useState('p3');
  const [dueDate, setDueDate]     = useState('');
  const [dueTime, setDueTime]     = useState('');
  const [category, setCategory]   = useState('other');
  const [status, setStatus]       = useState('todo');
  const [projectTag, setProjectTag] = useState('');
  const [subject, setSubject]     = useState('');
  const [notes, setNotes]         = useState('');
  const [effort, setEffort]       = useState('');
  const [showMore, setShowMore]   = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setPriority(editTask.priority || 'p3');
      setDueDate(editTask.dueDate ? format(new Date(editTask.dueDate), 'yyyy-MM-dd') : '');
      setDueTime(editTask.dueTime || '');
      setCategory(editTask.category || 'other');
      setStatus(editTask.status || 'todo');
      setProjectTag(editTask.projectTag || '');
      setSubject(editTask.subject || '');
      setNotes(editTask.notes || '');
      setEffort(editTask.effortEstimate || '');
    } else {
      setTitle(''); setPriority('p3'); setDueDate(''); setDueTime('');
      setCategory('other'); setStatus('todo'); setProjectTag('');
      setSubject(''); setNotes(''); setEffort(''); setShowMore(false);
    }
  }, [editTask, open]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
  };

  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => { invalidate(); toast.success('Task added'); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => taskApi.update(editTask._id, data),
    onSuccess: () => { invalidate(); toast.success('Updated'); onClose(); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const categories = segment === 'work' ? WORK_CATEGORIES : STUDENT_CATEGORIES;

  const handleTitleChange = (v) => {
    setTitle(v);
    if (!isEdit && v.toLowerCase().includes('meeting') && segment === 'work') setCategory('meeting-prep');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const payload = {
      title, priority, status, category, segment,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      projectTag, subject, notes, effortEstimate: effort,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const inputStyle = { background: SURF2, border: `1px solid ${BORD}`, color: PRIM };

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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: PRIM }}>
                  {isEdit ? 'Edit Task' : 'New Task'}
                </h3>
                <button onClick={onClose} className="p-1.5 rounded-lg touch-manipulation" style={{ color: MUTED }}>
                  <X size={16} />
                </button>
              </div>

              <input
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full py-3.5 px-4 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none mb-4"
                style={inputStyle}
              />

              {/* Priority */}
              <div className="flex gap-2 mb-4">
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className="flex-1 py-2.5 rounded-2xl text-[10px] font-bold transition-all touch-manipulation"
                    style={{
                      background: priority === p.value ? PRIORITY_COLORS[p.value] : SURF2,
                      color: priority === p.value ? '#fff' : MUTED,
                      border: `1px solid ${priority === p.value ? PRIORITY_COLORS[p.value] : BORD}`,
                    }}
                  >
                    {p.value.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Due date + time */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none" style={inputStyle} />
                <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none" style={inputStyle} />
              </div>

              {/* More options toggle */}
              <button
                onClick={() => setShowMore(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold mb-4 touch-manipulation"
                style={{ color: MUTED }}
              >
                {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMore ? 'Less' : 'More options'}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden mb-4"
                  >
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none" style={inputStyle}>
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>

                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none" style={inputStyle}>
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    <select value={effort} onChange={(e) => setEffort(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none" style={inputStyle}>
                      <option value="">Effort estimate</option>
                      {EFFORT_OPTIONS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>

                    {segment === 'work' ? (
                      <input value={projectTag} onChange={(e) => setProjectTag(e.target.value)}
                        placeholder="Sprint / Project tag"
                        className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none"
                        style={inputStyle} />
                    ) : (
                      <input value={subject} onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject (DSA, OS, CN…)"
                        className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none"
                        style={inputStyle} />
                    )}

                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes…" rows={2}
                      className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-[#544F4C] focus:outline-none resize-none"
                      style={inputStyle} />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={!title.trim() || isPending}
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-40 touch-manipulation"
                style={{ background: ORANGE }}
              >
                {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const categories = [...WORK_CATEGORIES, ...STUDENT_CATEGORIES];
  const cat = categories.find((c) => c.value === task.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: SURF,
        border: `1px solid ${task.status === 'blocked' ? '#ef444440' : BORD}`,
        opacity: task.isCompleted ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        {/* Priority bar */}
        <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
          style={{ background: PRIORITY_COLORS[task.priority] || MUTED, minHeight: 20 }} />

        {/* Checkbox */}
        <button onClick={() => onToggle(task._id)}
          className="mt-0.5 h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all touch-manipulation"
          style={{ background: task.isCompleted ? ORANGE : 'transparent', borderColor: task.isCompleted ? ORANGE : MUTED }}>
          {task.isCompleted && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight"
            style={{ color: task.isCompleted ? MUTED : PRIM, textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.dueDate && (
              <span className="text-[10px] font-semibold" style={{ color: SEC }}>
                {format(new Date(task.dueDate), 'MMM d')}{task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
            {cat && <span className="text-[10px]" style={{ color: SEC }}>{cat.icon} {cat.label}</span>}
            {task.projectTag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                style={{ background: `${ORANGE}15`, color: ORANGE }}>
                {task.projectTag}
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
              style={{ background: `${STATUS_COLORS[task.status]}18`, color: STATUS_COLORS[task.status] }}>
              {TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status}
            </span>
          </div>
          {task.subTasks?.length > 0 && (
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-1.5 text-[10px] font-medium touch-manipulation"
              style={{ color: MUTED }}>
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {task.subTasks.filter((s) => s.isCompleted).length}/{task.subTasks.length} subtasks
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)}
            className="p-2 rounded-lg transition-colors touch-manipulation"
            style={{ color: MUTED }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(task._id)}
            className="p-2 rounded-lg transition-colors touch-manipulation"
            style={{ color: MUTED }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && task.subTasks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden" style={{ borderTop: `1px solid ${BORD}` }}
          >
            <div className="px-4 py-3 space-y-2" style={{ background: SURF2 }}>
              {task.subTasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded flex-shrink-0 border"
                    style={{ background: st.isCompleted ? ORANGE : 'transparent', borderColor: st.isCompleted ? ORANGE : BORD }} />
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
  const [segment, setSegment]           = useState('work');
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [editTask, setEditTask]         = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.TASKS, segment, filter, search],
    queryFn: () => taskApi.getAll({
      segment,
      filter: filter !== 'all' ? filter : undefined,
      search: search || undefined,
    }).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => taskApi.toggleComplete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TASKS_TODAY });
      toast.success('Deleted');
    },
  });

  const openAdd  = () => { setEditTask(null); setSheetOpen(true); };
  const openEdit = (task) => { setEditTask(task); setSheetOpen(true); };
  const closeSheet = () => { setSheetOpen(false); setEditTask(null); };

  const tasks     = data?.data || [];
  const active    = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

  return (
    <PageLayout>
      <div className="pb-8">

        {/* Title + Add */}
        <div className="flex items-center justify-between pt-1 mb-5">
          <h1 className="text-base font-semibold" style={{ color: PRIM }}>Tasks</h1>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white touch-manipulation"
            style={{ background: ORANGE }}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Segment */}
        <div className="flex rounded-2xl overflow-hidden mb-5" style={{ border: `1px solid ${BORD}`, background: SURF2 }}>
          {[{ value: 'work', label: '💼 Work' }, { value: 'student', label: '📚 Student' }].map(({ value, label }) => (
            <button key={value} onClick={() => setSegment(value)}
              className="flex-1 py-3.5 text-[13px] font-bold transition-all duration-200 touch-manipulation border-r last:border-r-0"
              style={{ background: segment === value ? ORANGE : 'transparent', color: segment === value ? '#fff' : MUTED, borderColor: BORD }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'overdue', label: 'Overdue' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => setFilter(value)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation"
              style={{
                background: filter === value ? ORANGE : SURF,
                color: filter === value ? '#fff' : MUTED,
                borderColor: filter === value ? ORANGE : BORD,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl placeholder:text-[#544F4C] focus:outline-none"
            style={{ background: SURF, border: `1px solid ${BORD}`, color: PRIM }} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 touch-manipulation" style={{ color: MUTED }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-3xl animate-pulse" style={{ background: SURF, border: `1px solid ${BORD}` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {active.length === 0 && (
              <div className="text-center py-14">
                <p className="text-3xl mb-3">✓</p>
                <p className="text-sm font-semibold mb-1" style={{ color: PRIM }}>All caught up</p>
                <p className="text-xs" style={{ color: MUTED }}>Tap Add to create a task</p>
              </div>
            )}
            {active.map((task) => (
              <TaskCard key={task._id} task={task}
                onToggle={(id) => toggleMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={openEdit} />
            ))}

            {completed.length > 0 && (
              <button onClick={() => setShowCompleted(v => !v)}
                className="flex items-center justify-center gap-2 mt-5 mb-2 text-xs font-bold w-full py-3 rounded-2xl touch-manipulation"
                style={{ background: SURF2, border: `1px solid ${BORD}`, color: MUTED }}>
                {showCompleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {completed.length} Completed
              </button>
            )}
            {showCompleted && completed.map((task) => (
              <TaskCard key={task._id} task={task}
                onToggle={(id) => toggleMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <TaskSheet open={sheetOpen} onClose={closeSheet} segment={segment} editTask={editTask} />
    </PageLayout>
  );
}
