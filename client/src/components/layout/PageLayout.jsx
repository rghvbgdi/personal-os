import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function PageLayout({ title, subtitle, actions, action, children }) {
  const headerActions = actions || action;
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} actions={headerActions} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="p-4 lg:p-6 max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
