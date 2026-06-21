import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';

const pageVariants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 1.01 },
};

export default function PageLayout({ children }) {
  return (
    <div className="flex h-full overflow-hidden select-none" style={{ background: '#1C1917' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
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
        <BottomNav />
      </div>
    </div>
  );
}
