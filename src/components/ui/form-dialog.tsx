'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface FormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Standardized form dialog component
 * Use for any form-based modal (create, edit, settings, etc.)
 */
export function FormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  children,
}: FormDialogProps) {
  const handleSubmit = async () => {
    try {
      await onSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error('Error in FormDialog onSubmit:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-w-[95vw] p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          {description && <DialogDescription className="text-foreground/70 font-medium">{description}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 pb-6">
          {children}
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-border/40 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : submitText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
