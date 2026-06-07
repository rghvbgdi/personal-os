import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search, LayoutDashboard, Wallet, BarChart3, Target, PieChart,
  Code2, StickyNote, Flame, Plus, ArrowRight, TrendingUp,
} from 'lucide-react';
import { useCommandPalette } from '@/context/CommandPaletteContext.jsx';
import { expensesApi } from '@/api/expenses.api.js';
import { placementApi, noteApi } from '@/api/index.js';
import { ROUTES, CATEGORIES } from '@/constants/index.js';
import { formatCurrency, formatDate } from '@/utils/formatters.js';
import { cn } from '@/utils/cn.js';

const STATIC_ACTIONS = [
  { id: 'nav-dashboard', type: 'page', label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.DASHBOARD, group: 'Navigation' },
  { id: 'nav-expenses', type: 'page', label: 'Expenses', icon: Wallet, to: ROUTES.EXPENSES, group: 'Navigation' },
  { id: 'nav-analytics', type: 'page', label: 'Analytics', icon: BarChart3, to: ROUTES.ANALYTICS, group: 'Navigation' },
  { id: 'nav-budget', type: 'page', label: 'Budget', icon: PieChart, to: ROUTES.BUDGET, group: 'Navigation' },
  { id: 'nav-goals', type: 'page', label: 'Goals', icon: Target, to: ROUTES.GOALS, group: 'Navigation' },
  { id: 'nav-placement', type: 'page', label: 'Placement', icon: Code2, to: ROUTES.PLACEMENT, group: 'Navigation' },
  { id: 'nav-notes', type: 'page', label: 'Notes', icon: StickyNote, to: ROUTES.NOTES, group: 'Navigation' },
  { id: 'nav-habits', type: 'page', label: 'Habits', icon: Flame, to: ROUTES.HABITS, group: 'Navigation' },
];

function ResultItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all rounded-lg mx-1',
        isActive ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
      )}
    >
      <div className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm',
        item.type === 'expense' ? 'bg-surface-2' : 'bg-surface-2',
      )}>
        {typeof Icon === 'string' ? Icon : <Icon className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        {item.subtitle && <p className="text-xs text-text-muted truncate">{item.subtitle}</p>}
      </div>
      {item.meta && <span className="text-xs text-text-muted flex-shrink-0">{item.meta}</span>}
      {isActive && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
    </button>
  );
}

function GroupLabel({ label }) {
  return (
    <p className="px-5 pt-3 pb-1 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
      {label}
    </p>
  );
}

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { data: expensesData } = useQuery({
    queryKey: ['cmd-expenses', query],
    queryFn: () => expensesApi.getAll({ search: query, limit: 5 }).then((r) => r.data.data),
    enabled: isOpen && query.length >= 1,
  });

  const { data: placementData } = useQuery({
    queryKey: ['cmd-placement', query],
    queryFn: () => placementApi.getAll({ search: query, limit: 5 }).then((r) => r.data),
    enabled: isOpen && query.length >= 1,
  });

  const { data: notesData } = useQuery({
    queryKey: ['cmd-notes', query],
    queryFn: () => noteApi.getAll({ search: query }).then((r) => r.data.data),
    enabled: isOpen && query.length >= 1,
  });

  const results = useMemo(() => {
    const groups = [];
    const q = query.toLowerCase();

    if (query.length === 0) {
      groups.push({
        label: 'Navigation',
        items: STATIC_ACTIONS.map((a) => ({ ...a })),
      });
      return groups;
    }

    const navMatches = STATIC_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
    if (navMatches.length) groups.push({ label: 'Pages', items: navMatches });

    if (expensesData?.length) {
      groups.push({
        label: 'Expenses',
        items: expensesData.map((e) => {
          const cat = CATEGORIES.find((c) => c.value === e.category);
          return {
            id: e._id, type: 'expense',
            icon: cat?.icon || '📦',
            label: e.title,
            subtitle: `${formatDate(e.date)} · ${cat?.label}`,
            meta: formatCurrency(e.amount),
            to: ROUTES.EXPENSES,
          };
        }),
      });
    }

    if (placementData?.data?.length) {
      groups.push({
        label: 'Placement Topics',
        items: placementData.data.map((t) => ({
          id: t._id, type: 'topic',
          icon: Code2,
          label: t.title,
          subtitle: `${t.subject?.toUpperCase()} · ${t.mastery}`,
          to: ROUTES.PLACEMENT,
        })),
      });
    }

    if (notesData?.notes?.length) {
      groups.push({
        label: 'Notes',
        items: notesData.notes.map((n) => ({
          id: n._id, type: 'note',
          icon: StickyNote,
          label: n.title,
          subtitle: n.tags?.join(', ') || 'No tags',
          to: ROUTES.NOTES,
        })),
      });
    }

    return groups;
  }, [query, expensesData, placementData, notesData]);

  const flatItems = results.flatMap((g) => g.items);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && flatItems[activeIdx]) { handleSelect(flatItems[activeIdx]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatItems, activeIdx]);

  const handleSelect = (item) => {
    if (item.to) navigate(item.to);
    close();
    setQuery('');
  };

  let flatIdx = 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-elevated overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search className="h-4 w-4 text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, expenses, topics, notes..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-muted font-mono flex-shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[380px] overflow-y-auto py-1.5 pb-2">
              {flatItems.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-text-muted gap-2">
                  <Search className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                results.map((group) => (
                  <div key={group.label}>
                    <GroupLabel label={group.label} />
                    {group.items.map((item) => {
                      const idx = flatIdx++;
                      return (
                        <ResultItem
                          key={item.id || item.label}
                          item={item}
                          isActive={activeIdx === idx}
                          onClick={() => handleSelect(item)}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border text-[10px] text-text-muted">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">ESC</kbd> close</span>
              <span className="ml-auto opacity-50">Personal OS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
