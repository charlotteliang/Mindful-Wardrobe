import React from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'destructive'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
            </div>
            
            <p className="text-stone-600 mb-6 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant={confirmVariant} 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
