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
      The outer div fills 100% of #root (which is 100% of body → html → viewport).
      flex-col layout: Header → scrollable main → BottomNav.
      
      BottomNav is a FLEX CHILD (not position:fixed). It naturally sits at the
      bottom. Its own paddingBottom covers the home indicator safe area.
      The background extends to the absolute screen edge. No gap possible.
    */
    <div className="flex flex-col h-full bg-black overflow-hidden select-none">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-h-0 relative">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-ios min-h-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="p-4 max-w-2xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom nav — flex child at the bottom (mobile only) */}
      <BottomNav />
    </div>
  );
}
