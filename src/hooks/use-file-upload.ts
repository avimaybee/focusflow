
'use client';

import { useState, DragEvent } from 'react';
import { useToast } from '@/hooks/use-toast';

export type Attachment = {
  name: string;
  type: string;
  data: string;
  preview: string;
};

export function useFileUpload() {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please upload an image, PDF, or text file.',
      });
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Please upload a file smaller than 10MB.`,
      });
      return;
    }

    const { id: toastId } = toast({
      title: 'Uploading...',
      description: `Your file "${file.name}" is being uploaded.`,
    });

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : file.name;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        setAttachments(prev => [...prev, {
          preview: previewUrl,
          data: dataUrl,
          type: file.type,
          name: file.name,
        }]);
        toast({
          id: toastId,
          variant: 'default',
          title: 'Upload Successful',
          description: `"${file.name}" is ready.`,
        });
      } catch (error) {
        console.error("File processing error:", error);
        toast({
          id: toastId,
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Could not process your file. Please try again.',
        });
      }
    };
    reader.readAsDataURL(file);

    if (previewUrl.startsWith('blob:')) {
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const fileUploadHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  return {
    attachments,
    setAttachments,
    isDraggingOver,
    handleFileSelect,
    fileUploadHandlers,
  };
}
