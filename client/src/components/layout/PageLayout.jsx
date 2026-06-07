import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -5 },
};

export default function PageLayout({ title, subtitle, actions, action, children }) {
  const headerActions = actions || action;

  return (
    <div className="flex flex-col bg-[#0a0a0a] overflow-hidden" style={{ height: '100dvh' }}>
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-h-0">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="p-4 max-w-2xl mx-auto w-full"
            style={{
              /* Bottom padding: 56px nav + safe-area + 16px breathing room */
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
