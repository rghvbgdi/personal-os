import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Plus, Pin, Trash2, Pencil, StickyNote, Search } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { noteApi } from '@/api/index.js';
import { QUERY_KEYS } from '@/constants/index.js';
import { formatRelativeTime } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(120),
  content: z.string().default(''),
  tags: z.string().optional(),
  isPinned: z.boolean().default(false),
});

const NOTE_COLORS = [null, '#1a1a2e', '#0f2027', '#0d1b1e', '#1a0a0a', '#0a1a0a'];

function NoteForm({ defaultValues, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const isEdit = !!defaultValues?._id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      tags: defaultValues.tags?.join(', ') || '',
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, tags: d.tags ? d.tags.split(',').map((t) => t.trim()).filter(Boolean) : [] };
      return isEdit ? noteApi.update(defaultValues._id, payload) : noteApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTES });
      toast.success(isEdit ? 'Note updated' : 'Note created');
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Input label="Title" placeholder="Quicksort implementation..." error={errors.title?.message} {...register('title')} />
      <Textarea label="Content (markdown supported)" rows={8} placeholder="# Notes&#10;&#10;Write your notes here..." {...register('content')} />
      <Input label="Tags (comma separated)" placeholder="dsa, arrays, sorting" {...register('tags')} />
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input type="checkbox" className="accent-warning" {...register('isPinned')} /> Pin this note
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Save note'}</Button>
      </div>
    </form>
  );
}

export default function Notes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.NOTES, search],
    queryFn: () => noteApi.getAll({ search }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: noteApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTES }); toast.success('Deleted'); },
  });

  const togglePin = useMutation({
    mutationFn: ({ id, isPinned }) => noteApi.update(id, { isPinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTES }),
  });

  const notes = data?.notes || [];

  return (
    <PageLayout
      title="Notes"
      subtitle="Markdown-supported personal notes"
      actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditItem(null); setModalOpen(true); }}>New note</Button>}
    >
      <div className="space-y-4">
        <Input placeholder="Search notes..." leftIcon={<Search className="h-4 w-4" />}
          value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
            <StickyNote className="h-12 w-12 opacity-20" />
            <p className="text-sm">No notes yet</p>
            <Button size="sm" onClick={() => setModalOpen(true)}>Create first note</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map((note, i) => (
              <motion.div key={note._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2 group hover:border-border transition-all shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-1 flex-1">{note.title}</h3>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => togglePin.mutate({ id: note._id, isPinned: !note.isPinned })}
                      className={cn('p-1 rounded hover:bg-surface-2 transition-colors',
                        note.isPinned ? 'text-warning' : 'text-text-muted')}>
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEditItem(note); setModalOpen(true); }}
                      className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this note?')) deleteMutation.mutate(note._id); }}
                      className="p-1 rounded hover:bg-danger/5 text-text-muted hover:text-danger transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-xs text-text-muted line-clamp-3 flex-1 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                )}
                {note.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-text-muted">{formatRelativeTime(note.updatedAt)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Note' : 'New Note'} size="lg">
        <NoteForm defaultValues={editItem}
          onSuccess={() => { setModalOpen(false); setEditItem(null); }}
          onCancel={() => { setModalOpen(false); setEditItem(null); }} />
      </Modal>
    </PageLayout>
  );
}
