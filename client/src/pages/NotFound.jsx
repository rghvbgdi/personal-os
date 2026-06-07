import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button.jsx';
import { ROUTES } from '@/constants/index.js';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <p className="text-7xl font-bold text-surface-2">404</p>
        <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
        <p className="text-text-secondary text-sm">This page doesn't exist in your OS.</p>
        <Link to={ROUTES.DASHBOARD}>
          <Button className="mt-2">Go to Dashboard</Button>
        </Link>
      </motion.div>
    </div>
  );
}
