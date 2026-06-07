import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, ExternalLink, Star, Plus, Trash2, Pencil,
  Search, CheckCircle2, Circle, RefreshCw, BookOpen, RotateCcw, ListTodo,
  BarChart3, Filter,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { progressApi, placementApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';
import {
  SUBJECT_META, ALL_SUBJECTS, getTotalCount, getAllQuestionsForSubject,
} from '@/data/placement.data.js';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  todo:    { label: 'Todo',    color: 'text-text-muted',    dot: 'bg-surface-2 border-border',   ring: '' },
  solving: { label: 'Solving', color: 'text-warning',       dot: 'bg-warning/20 border-warning',  ring: 'ring-1 ring-warning/30' },
  done:    { label: 'Done',    color: 'text-accent',        dot: 'bg-accent/20 border-accent',    ring: 'ring-1 ring-accent/30' },
  revise:  { label: 'Revise',  color: 'text-info',          dot: 'bg-info/20 border-info',        ring: 'ring-1 ring-info/30' },
};

const DIFF = {
  easy:   { label: 'Easy',   variant: 'success' },
  medium: { label: 'Med',    variant: 'warning' },
  hard:   { label: 'Hard',   variant: 'danger' },
};

const STATUS_ORDER = ['todo', 'solving', 'done', 'revise'];

// ─── Confidence stars ─────────────────────────────────────────────────────────

function ConfidenceStars({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange(n === value ? null : n)}
          className={cn('transition-colors', readonly ? 'cursor-default' : 'hover:scale-110')}
          disabled={readonly}
        >
          <Star className={cn('h-3 w-3', n <= value ? 'fill-warning text-warning' : 'text-border')} />
        </button>
      ))}
    </div>
  );
}

// ─── Question row ─────────────────────────────────────────────────────────────

function QuestionRow({ q, progress, onUpdate }) {
  const p = progress || { status: 'todo', confidence: null };
  const s = STATUS[p.status] || STATUS.todo;
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(p.notes || '');

  const cycleStatus = () => {
    const idx = STATUS_ORDER.indexOf(p.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onUpdate(q.id, { status: next, confidence: p.confidence, notes: p.notes });
  };

  const saveNotes = () => {
    onUpdate(q.id, { status: p.status, confidence: p.confidence, notes });
    setNotesOpen(false);
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
      p.status === 'done' ? 'bg-accent/5' : 'hover:bg-surface-2',
    )}>
      {/* Status toggle */}
      <button
        onClick={cycleStatus}
        className={cn('h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all', s.dot)}
        title={`Status: ${s.label} — click to cycle`}
      >
        {p.status === 'done' && <CheckCircle2 className="h-3 w-3 text-accent" />}
        {p.status === 'solving' && <RefreshCw className="h-3 w-3 text-warning" />}
        {p.status === 'revise' && <RotateCcw className="h-3 w-3 text-info" />}
      </button>

      {/* Title */}
      <span className={cn('flex-1 text-sm', p.status === 'done' ? 'text-text-secondary line-through decoration-text-muted/40' : 'text-text-primary')}>
        {q.title}
      </span>

      {/* Confidence stars (visible when done) */}
      {p.status === 'done' && (
        <ConfidenceStars
          value={p.confidence}
          onChange={(v) => onUpdate(q.id, { status: 'done', confidence: v, notes: p.notes })}
        />
      )}

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge variant={DIFF[q.difficulty]?.variant || 'default'} className="text-[10px] px-1.5">
          {DIFF[q.difficulty]?.label}
        </Badge>

        {/* Notes indicator */}
        <button
          onClick={() => { setNotes(p.notes || ''); setNotesOpen(true); }}
          className={cn('p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
            p.notes ? 'opacity-100 text-accent' : 'text-text-muted hover:text-text-secondary')}
          title="Notes"
        >
          <BookOpen className="h-3 w-3" />
        </button>

        {/* LC link */}
        {q.lc && (
          <a href={q.lc} target="_blank" rel="noopener noreferrer"
            className="p-1 rounded text-text-muted hover:text-info opacity-0 group-hover:opacity-100 transition-all">
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Notes modal inline */}
      {notesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setNotesOpen(false)}>
          <div className="bg-surface border border-border rounded-xl p-4 w-full max-w-sm shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-text-primary mb-2">{q.title}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Your notes, approach, edge cases..."
              className="w-full text-sm bg-surface-2 border border-border rounded-lg p-2.5 text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setNotesOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveNotes}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Topic accordion ──────────────────────────────────────────────────────────

function TopicAccordion({ topic, progressMap, onUpdate, filterStatus, filterDiff }) {
  const [open, setOpen] = useState(false);

  const filtered = topic.questions.filter((q) => {
    if (filterStatus && filterStatus !== 'all') {
      const s = progressMap[q.id]?.status || 'todo';
      if (s !== filterStatus) return false;
    }
    if (filterDiff && filterDiff !== 'all' && q.difficulty !== filterDiff) return false;
    return true;
  });

  const done = topic.questions.filter((q) => progressMap[q.id]?.status === 'done').length;
  const pct = Math.round((done / topic.questions.length) * 100);

  if (filtered.length === 0 && (filterStatus || filterDiff)) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-2 transition-colors text-left"
      >
        <span className="text-text-muted">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="flex-1 text-sm font-semibold text-text-primary">{topic.title}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-text-muted">{done}/{topic.questions.length}</span>
          <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-text-secondary w-8 text-right">{pct}%</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-0.5 bg-surface border-t border-border">
              {filtered.map((q) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  progress={progressMap[q.id]}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject tab content ──────────────────────────────────────────────────────

function SubjectView({ subject, progressMap, onUpdate }) {
  const meta = SUBJECT_META[subject];
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [search, setSearch] = useState('');

  const allQs = useMemo(() => getAllQuestionsForSubject(subject), [subject]);
  const done = allQs.filter((q) => progressMap[q.id]?.status === 'done').length;
  const solving = allQs.filter((q) => progressMap[q.id]?.status === 'solving').length;
  const revise = allQs.filter((q) => progressMap[q.id]?.status === 'revise').length;

  const filteredTopics = useMemo(() => {
    if (!search) return meta.topics;
    return meta.topics.map((t) => ({
      ...t,
      questions: t.questions.filter((q) => q.title.toLowerCase().includes(search.toLowerCase())),
    })).filter((t) => t.questions.length > 0);
  }, [meta.topics, search]);

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', val: allQs.length, color: 'text-text-primary' },
          { label: 'Done', val: done, color: 'text-accent' },
          { label: 'Solving', val: solving, color: 'text-warning' },
          { label: 'Revise', val: revise, color: 'text-info' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className={cn('text-xl font-bold', s.color)}>{s.val}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40 max-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-1">
          {['all', 'todo', 'solving', 'done', 'revise'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn('px-2.5 py-1 text-xs rounded-lg border capitalize transition-all',
                filterStatus === s ? 'border-accent text-accent bg-accent-subtle' : 'border-border text-text-muted hover:text-text-secondary')}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setFilterDiff(d)}
              className={cn('px-2.5 py-1 text-xs rounded-lg border capitalize transition-all',
                filterDiff === d ? 'border-accent text-accent bg-accent-subtle' : 'border-border text-text-muted hover:text-text-secondary')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Topic accordions */}
      <div className="space-y-2">
        {filteredTopics.map((topic) => (
          <TopicAccordion
            key={topic.id}
            topic={topic}
            progressMap={progressMap}
            onUpdate={onUpdate}
            filterStatus={filterStatus !== 'all' ? filterStatus : null}
            filterDiff={filterDiff !== 'all' ? filterDiff : null}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Custom Todo List ─────────────────────────────────────────────────────────

const todoSchema = z.object({
  subject: z.string().min(1, 'Subject required'),
  title: z.string().min(1, 'Title required').max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  notes: z.string().max(2000).optional(),
  sourceUrl: z.string().optional().or(z.literal('')),
});

function TodoSection() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PLACEMENT_TODO,
    queryFn: () => placementApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(todoSchema),
    defaultValues: editItem || { difficulty: 'medium' },
  });

  const saveMutation = useMutation({
    mutationFn: (d) => editItem ? placementApi.update(editItem._id, d) : placementApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PLACEMENT_TODO });
      toast.success(editItem ? 'Updated' : 'Added to list');
      setModalOpen(false);
      setEditItem(null);
      reset();
    },
  });

  const solveMutation = useMutation({
    mutationFn: (id) => placementApi.update(id, { isSolved: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.PLACEMENT_TODO }),
  });

  const deleteMutation = useMutation({
    mutationFn: placementApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PLACEMENT_TODO });
      toast.success('Removed');
    },
  });

  const openAdd = () => { setEditItem(null); reset({ difficulty: 'medium' }); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); reset(item); setModalOpen(true); };

  const items = data?.topics || data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Track custom topics, company-specific questions, or anything else</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add item</Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-12 bg-surface-2 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <ListTodo className="h-10 w-10 opacity-20" />
          <p className="text-sm">Your personal prep list is empty</p>
          <Button variant="ghost" size="sm" onClick={openAdd}>Add first item</Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const subj = SUBJECT_META[item.subject] || SUBJECT_META.dsa;
            return (
              <div key={item._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group border border-transparent hover:border-border">
                <button
                  onClick={() => !item.isSolved && solveMutation.mutate(item._id)}
                  className={cn('h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    item.isSolved ? 'border-accent bg-accent' : 'border-border hover:border-accent')}
                >
                  {item.isSolved && <CheckCircle2 className="h-3 w-3 text-white" />}
                </button>

                <span className="text-base flex-shrink-0">{subj.icon}</span>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', item.isSolved ? 'text-text-muted line-through' : 'text-text-primary')}>
                    {item.title}
                  </p>
                  {item.notes && <p className="text-xs text-text-muted truncate">{item.notes}</p>}
                </div>

                <Badge variant={DIFF[item.difficulty]?.variant || 'default'} className="text-[10px]">
                  {DIFF[item.difficulty]?.label}
                </Badge>

                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-info transition-all">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-danger hover:bg-danger/5"
                    onClick={() => { if (confirm('Remove?')) deleteMutation.mutate(item._id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Item' : 'Add to My List'}>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Subject"
              options={ALL_SUBJECTS.map((s) => ({ value: s, label: `${SUBJECT_META[s].icon} ${SUBJECT_META[s].label}` }))}
              error={errors.subject?.message} {...register('subject')} />
            <Select label="Difficulty" options={[
              { value: 'easy', label: '🟢 Easy' },
              { value: 'medium', label: '🟡 Medium' },
              { value: 'hard', label: '🔴 Hard' },
            ]} {...register('difficulty')} />
          </div>
          <Input label="Topic / Question" placeholder="Two Sum variant, Deadlock scenario..." error={errors.title?.message} {...register('title')} />
          <Input label="Resource URL (optional)" placeholder="https://leetcode.com/..." {...register('sourceUrl')} />
          <Textarea label="Notes" rows={3} placeholder="Your thoughts, approach..." {...register('notes')} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editItem ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Overview stats ───────────────────────────────────────────────────────────

function OverviewStats({ progressMap }) {
  const allCounts = useMemo(() => {
    const counts = { total: 0, done: 0, solving: 0, revise: 0, todo: 0 };
    ALL_SUBJECTS.forEach((s) => {
      const qs = getAllQuestionsForSubject(s);
      counts.total += qs.length;
      qs.forEach((q) => {
        const status = progressMap[q.id]?.status || 'todo';
        counts[status] = (counts[status] || 0) + 1;
      });
    });
    return counts;
  }, [progressMap]);

  const overallPct = Math.round((allCounts.done / allCounts.total) * 100);

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">Overall Progress</span>
          <span className="text-sm font-bold text-accent">{allCounts.done} / {allCounts.total}</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-accent rounded-full"
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-text-muted">
          <span className="text-accent">● {allCounts.done} done</span>
          <span className="text-warning">● {allCounts.solving} solving</span>
          <span className="text-info">● {allCounts.revise} revise</span>
          <span>● {allCounts.todo} todo</span>
        </div>
      </div>

      {/* Per-subject progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ALL_SUBJECTS.map((s) => {
          const meta = SUBJECT_META[s];
          const qs = getAllQuestionsForSubject(s);
          const done = qs.filter((q) => progressMap[q.id]?.status === 'done').length;
          const pct = Math.round((done / qs.length) * 100);
          return (
            <div key={s} className="bg-surface border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{meta.icon}</span>
                <span className="text-xs font-semibold text-text-primary">{meta.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{done}/{qs.length}</span>
                <span className="font-medium text-text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  ...ALL_SUBJECTS.map((s) => ({ id: s, label: SUBJECT_META[s].label, icon: null, emoji: SUBJECT_META[s].icon })),
  { id: 'mylist', label: 'My List', icon: ListTodo },
];

export default function Placement() {
  const [activeTab, setActiveTab] = useState('overview');
  const qc = useQueryClient();

  const { data: progressData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PLACEMENT_PROGRESS,
    queryFn: () => progressApi.getAll().then((r) => r.data.data.map),
    initialData: {},
  });

  const progressMap = progressData || {};

  const updateMutation = useMutation({
    mutationFn: ({ questionId, status, confidence, notes }) =>
      progressApi.upsert({ questionId, status, confidence: confidence || null, notes: notes || '' }),
    onSuccess: (res, vars) => {
      qc.setQueryData(QUERY_KEYS.PLACEMENT_PROGRESS, (old = {}) => ({
        ...old,
        [vars.questionId]: res.data.data.progress,
      }));
    },
    onError: () => toast.error('Failed to save'),
  });

  const handleUpdate = useCallback((questionId, updates) => {
    updateMutation.mutate({ questionId, ...updates });
  }, [updateMutation]);

  return (
    <PageLayout
      title="Placement Prep"
      subtitle="Striver A2Z · OOPs · DBMS · OS · CN · System Design"
    >
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const subject = SUBJECT_META[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  isActive
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border text-text-muted hover:text-text-secondary hover:bg-surface-2',
                )}
              >
                {tab.emoji && <span className="text-base leading-none">{tab.emoji}</span>}
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <OverviewStats progressMap={progressMap} />
            )}

            {activeTab === 'mylist' && (
              <TodoSection />
            )}

            {ALL_SUBJECTS.includes(activeTab) && (
              <SubjectView
                key={activeTab}
                subject={activeTab}
                progressMap={progressMap}
                onUpdate={handleUpdate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
