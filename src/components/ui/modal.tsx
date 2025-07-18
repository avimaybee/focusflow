'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal = ({ isOpen, onClose, children, className, showCloseButton = true }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "relative z-10 w-full rounded-xl bg-secondary border border-border/80 shadow-2xl overflow-hidden",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7 z-20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
