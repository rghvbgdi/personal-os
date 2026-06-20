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
      Layout strategy (iOS PWA compatible):
      
      #root is height:100% (spans full physical viewport via html>body>root chain).
      This outer div fills #root with flex-col.
      Children stack: [Sidebar(desktop)] [Header] [Main(scrollable)] [BottomNav].
      
      BottomNav is a flex child (NOT position:fixed). It sits at the bottom
      of the flex column. Its padding-bottom: env(safe-area-inset-bottom) pushes
      interactive elements above the home indicator while its background color
      fills the chin area. Because we use height:100% (not position:fixed),
      the container truly spans to the physical screen edge.
    */
    <div className="flex h-full overflow-hidden select-none" style={{ background: '#000000' }}>
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
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

        {/* Bottom nav — flex child at the bottom (mobile only) */}
        <BottomNav />
      </div>
    </div>
  );
}
