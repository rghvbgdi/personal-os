import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function PageLayout({ title, subtitle, actions, action, children }) {
  const headerActions = actions || action;

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto scroll-smooth-ios"
        >
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            /* pb-28 on mobile: 56px nav + ~16px gap + safe-area */
            className="p-4 lg:p-6 max-w-7xl mx-auto w-full"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom nav — mobile only (hidden on lg+) */}
      <BottomNav />
    </div>
  );
}
