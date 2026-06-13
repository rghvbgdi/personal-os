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
      `fixed inset-0` = position:fixed; top:0; right:0; bottom:0; left:0
      This pins the layout to the exact visual viewport — identical to the
      original working commit (7f58740). Combined with `position:fixed` on
      html/body in index.css, this is the proven iOS PWA layout pattern.
    */
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden select-none">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-h-0 relative">
        <Header title={title} subtitle={subtitle} actions={headerActions} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-ios"
          style={{
            WebkitOverflowScrolling: 'touch',
            /* 80px = nav bar (56px) + extra buffer. Safe-area adds home indicator space. */
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
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

      {/* Bottom nav — fixed to viewport bottom, mobile only */}
      <BottomNav />
    </div>
  );
}
