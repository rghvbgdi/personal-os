import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import MathInput from '@/components/ui/MathInput.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { SkeletonCard } from '@/components/ui/Skeleton.jsx';
import { goalApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { formatCurrency, formatDate } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(80),
  description: z.string().max(300).optional(),
  targetAmount: z.coerce.number().positive('Must be > 0'),
  savedAmount: z.coerce.number().min(0).default(0),
  type: z.enum(['savings', 'emergency', 'investment', 'purchase', 'travel', 'other']),
  deadline: z.string().optional(),
});

const GOAL_TYPES = [
  { value: 'savings', label: '💰 Savings' },
  { value: 'emergency', label: '🆘 Emergency Fund' },
  { value: 'investment', label: '📈 Investment' },
  { value: 'purchase', label: '🛍️ Purchase' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'other', label: '📦 Other' },
];

function GoalForm({ defaultValues, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const isEdit = !!defaultValues?._id;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      deadline: defaultValues.deadline ? defaultValues.deadline.split('T')[0] : '',
    } : { type: 'savings', savedAmount: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? goalApi.update(defaultValues._id, data) : goalApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GOALS });
      toast.success(isEdit ? 'Goal updated' : 'Goal created');
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Input label="Goal title" placeholder="Emergency fund 6 months..." error={errors.title?.message} {...register('title')} />
      <div className="grid grid-cols-2 gap-3">
        <MathInput label="Target (₹)" placeholder="100000" error={errors.targetAmount?.message} {...register('targetAmount')} />
        <MathInput label="Saved so far (₹)" placeholder="0" {...register('savedAmount')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" options={GOAL_TYPES} error={errors.type?.message} {...register('type')} />
        <Input label="Deadline" type="date" {...register('deadline')} />
      </div>
      <Textarea label="Description (optional)" rows={2} {...register('description')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create goal'}</Button>
      </div>
    </form>
  );
}

function GoalCard({ goal, onEdit, onDelete }) {
  const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
  const remaining = goal.targetAmount - goal.savedAmount;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('rounded-xl border p-5 shadow-card transition-all group',
        goal.isCompleted ? 'bg-accent-subtle border-accent-muted' : 'bg-surface border-border hover:border-border'
      )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">{goal.title}</h3>
            {goal.isCompleted && <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />}
          </div>
          {goal.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{goal.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onEdit(goal)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(goal._id)} className="hover:text-danger hover:bg-danger/5">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">{formatCurrency(goal.savedAmount)} saved</span>
          <span className="font-semibold text-text-primary">{pct}%</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', goal.isCompleted ? 'bg-accent' : 'bg-accent')}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Target: {formatCurrency(goal.targetAmount)}</span>
          {!goal.isCompleted && <span>{formatCurrency(remaining)} to go</span>}
          {goal.deadline && <span>Due: {formatDate(goal.deadline, 'MMM d')}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function Goals() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.GOALS, showCompleted],
    queryFn: () => goalApi.getAll(showCompleted ? {} : { isCompleted: false }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: goalApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.GOALS }); toast.success('Deleted'); },
  });

  const goals = data?.goals || [];

  return (
    <PageLayout
      title="Goals"
      subtitle="Track your financial targets"
      actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditItem(null); setModalOpen(true); }}>New goal</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className={cn('text-xs px-3 py-1.5 rounded-lg border transition-all',
              showCompleted ? 'border-accent text-accent bg-accent-subtle' : 'border-border text-text-muted hover:text-text-secondary'
            )}
          >
            {showCompleted ? 'Showing all' : 'Show completed'}
          </button>
          <span className="text-xs text-text-muted">{goals.length} goals</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
            <Target className="h-12 w-12 opacity-20" />
            <p className="text-sm">No goals yet. Set your first financial target.</p>
            <Button size="sm" onClick={() => setModalOpen(true)}>Create a goal</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((g) => (
              <GoalCard key={g._id} goal={g}
                onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
                onDelete={(id) => { if (confirm('Delete this goal?')) deleteMutation.mutate(id); }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Goal' : 'New Goal'}>
        <GoalForm defaultValues={editItem} onSuccess={() => { setModalOpen(false); setEditItem(null); }}
          onCancel={() => { setModalOpen(false); setEditItem(null); }} />
      </Modal>
    </PageLayout>
  );
}
