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
      Using var(--app-height) set by window.innerHeight in main.jsx.
      This is the most reliable approach for iOS PWA — no position:fixed
      on the container, no fixed inset-0, just a flex column that fills
      the exact measured screen height.
      
      The BottomNav (fixed bottom-0) floats above this container.
      The <main> has paddingBottom to ensure content scrolls above the nav.
    */
    <div
      className="flex flex-col bg-black overflow-hidden select-none"
      style={{ height: 'var(--app-height, 100dvh)' }}
    >
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-h-0 relative">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-ios"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            /* 
              Pad bottom so content scrolls above the fixed nav:
              56px (nav height) + env(safe-area-inset-bottom) (~34px on iPhone 14 Pro)
              + 8px breathing room = ~98px total.
              We use 34px as fallback in case env() isn't available.
            */
            paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 64px)',
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

      {/* Bottom nav — fixed to viewport bottom (mobile only) */}
      <BottomNav />
    </div>
  );
}
