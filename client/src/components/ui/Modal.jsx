import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn.js';
import Button from './Button.jsx';

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          /* On mobile: align to bottom (iOS sheet). On sm+: center */
          className="fixed inset-0 z-50 flex sm:items-center items-end justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <motion.div
            /* Mobile: slide up from bottom. Desktop: scale in from center */
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'relative w-full bg-surface border border-border shadow-elevated',
              /* Mobile: full-width sheet sliding from bottom with top-only rounding */
              'rounded-t-3xl rounded-b-none sm:rounded-2xl',
              'overflow-y-auto',
              sizes[size],
              className,
            )}
            style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Drag handle — iOS sheet indicator */}
            <div className="h-1 w-10 bg-border rounded-full mx-auto mt-3 mb-1 sm:hidden" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
