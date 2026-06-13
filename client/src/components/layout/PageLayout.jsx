import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';

const pageVariants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 1.01 },
};

export default function PageLayout({ title, subtitle, actions, action, children }) {
  const headerActions = actions || action;

  return (
    /*
      KEY FIX: The outer container is `fixed inset-0` matching the #root which is
      also `position: fixed; inset: 0`. This means content is always constrained
      to the EXACT visual viewport — no overhang below the home indicator on iOS PWA.

      Since BottomNav is now `position: fixed; bottom: 0`, it doesn't occupy flex
      space here. The `<main>` gets `paddingBottom: var(--bottom-nav-height)` so
      scrollable content is not clipped behind the fixed nav bar.
    */
    <div className="h-full min-h-0 flex flex-col bg-black overflow-hidden select-none">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column — fills all space above where the fixed nav will sit */}
      <div className="flex flex-col flex-1 min-h-0 relative">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        {/*
          overflow-y-auto: scrollable content area
          paddingBottom = var(--bottom-nav-height): ensures last item isn't hidden
          behind the fixed BottomNav (56px bar + safe-area-inset-bottom)
        */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-ios flex flex-col"
          style={{ paddingBottom: 'var(--bottom-nav-height)' }}
        >
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="p-4 max-w-2xl mx-auto w-full flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom nav — fixed to viewport bottom (mobile only) */}
      <BottomNav />
    </div>
  );
}
