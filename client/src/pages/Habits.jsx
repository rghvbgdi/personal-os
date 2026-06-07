import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Plus, Flame, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import { format, isSameDay, subDays } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { SkeletonCard } from '@/components/ui/Skeleton.jsx';
import { habitApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  icon: z.string().default('✅'),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
});

function HabitForm({ defaultValues, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const isEdit = !!defaultValues?._id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { icon: '✅', frequency: 'daily' },
  });

  const mutation = useMutation({
    mutationFn: (d) => isEdit ? habitApi.update(defaultValues._id, d) : habitApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      toast.success(isEdit ? 'Updated' : 'Habit created');
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input label="Icon" placeholder="✅" maxLength={2} {...register('icon')} />
        <Input label="Habit name" placeholder="DSA practice, Morning run..." error={errors.name?.message} {...register('name')} />
      </div>
      <div className="flex gap-3">
        {['daily', 'weekly'].map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="radio" value={f} className="accent-accent" {...register('frequency')} />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

function HabitCard({ habit, onEdit, onDelete }) {
  const qc = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const doneTodayAlready = habit.completedDates?.some((d) => isSameDay(new Date(d), today));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const done = habit.completedDates?.some((cd) => isSameDay(new Date(cd), d));
    return { date: d, done };
  });

  const checkIn = useMutation({
    mutationFn: () => habitApi.checkIn(habit._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.HABITS }); toast.success(`${habit.icon} Checked in!`); },
    onError: (err) => toast.error(err.response?.data?.message || 'Already done today'),
  });

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('rounded-xl border p-4 shadow-card group transition-all',
        doneTodayAlready ? 'bg-accent-subtle border-accent-muted' : 'bg-surface border-border'
      )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{habit.icon}</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">{habit.name}</p>
            <p className="text-xs text-text-muted capitalize">{habit.frequency}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="hover:text-danger hover:bg-danger/5" onClick={() => onDelete(habit._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {last7.map(({ date, done }, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={cn('h-6 rounded-md w-full transition-all', done ? 'bg-accent' : 'bg-surface-2')} />
            <span className="text-[9px] text-text-muted">{format(date, 'E')[0]}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-warning" />
            {habit.currentStreak}d streak
          </span>
          <span>Best: {habit.longestStreak}d</span>
          <span>{habit.totalCompletions} total</span>
        </div>
        <Button
          size="sm"
          variant={doneTodayAlready ? 'secondary' : 'primary'}
          disabled={doneTodayAlready}
          loading={checkIn.isPending}
          onClick={() => checkIn.mutate()}
          leftIcon={doneTodayAlready ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        >
          {doneTodayAlready ? 'Done' : 'Check in'}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Habits() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.HABITS,
    queryFn: () => habitApi.getAll().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: habitApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.HABITS }); toast.success('Habit deleted'); },
  });

  const habits = data?.habits || [];
  const totalStreak = habits.reduce((a, h) => a + h.currentStreak, 0);
  const completedToday = habits.filter((h) =>
    h.completedDates?.some((d) => isSameDay(new Date(d), new Date()))
  ).length;

  return (
    <PageLayout
      title="Habits"
      subtitle="Build consistency, build discipline"
      actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditItem(null); setModalOpen(true); }}>Add habit</Button>}
    >
      <div className="space-y-4">
        {habits.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <div className="stat-card flex items-center gap-3 py-3 px-4 flex-1 min-w-[140px]">
              <Flame className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xs text-text-muted">Total streak days</p>
                <p className="text-lg font-bold text-text-primary">{totalStreak}</p>
              </div>
            </div>
            <div className="stat-card flex items-center gap-3 py-3 px-4 flex-1 min-w-[140px]">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-text-muted">Completed today</p>
                <p className="text-lg font-bold text-text-primary">{completedToday}/{habits.length}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
            <Flame className="h-12 w-12 opacity-20" />
            <p className="text-sm">No habits tracked yet</p>
            <Button size="sm" onClick={() => setModalOpen(true)}>Add your first habit</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habits.map((h) => (
              <HabitCard key={h._id} habit={h}
                onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
                onDelete={(id) => { if (confirm('Delete habit?')) deleteMutation.mutate(id); }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Habit' : 'New Habit'}>
        <HabitForm defaultValues={editItem}
          onSuccess={() => { setModalOpen(false); setEditItem(null); }}
          onCancel={() => { setModalOpen(false); setEditItem(null); }} />
      </Modal>
    </PageLayout>
  );
}
