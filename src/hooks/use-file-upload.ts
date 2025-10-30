
'use client';

import { useState, DragEvent, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Attachment } from '@/types/chat-types';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // Must stay in sync with API limit

const isSupportedFileType = (file: File) => {
  if (!file.type) return false;
  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('audio/') ||
    file.type.startsWith('video/') ||
    file.type.startsWith('text/') ||
    file.type === 'application/pdf'
  );
};

export function useFileUpload(setAttachment: Dispatch<SetStateAction<Attachment | null>>) {
  const { toast } = useToast();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!isSupportedFileType(file)) {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please upload an image, audio, video, PDF, or text file.',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload a file smaller than 20MB.',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      console.debug('[FileUpload] Upload response status', response.status);

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.file?.uri) {
        const message = payload?.error || payload?.details || 'Upload failed. Please try again.';
        throw new Error(message);
      }

      const uploaded = payload.file;

      console.debug('[FileUpload] Upload success payload', uploaded);

      const newAttachment: Attachment = {
        name: uploaded.displayName || uploaded.name || file.name,
        contentType: uploaded.mimeType || file.type,
        size: Number.parseInt(uploaded.sizeBytes ?? `${file.size}`, 10) || file.size,
        url: uploaded.uri,
      };

      setAttachment(newAttachment);
      toast({
        title: 'File Ready',
        description: `${newAttachment.name} attached to your message.`,
      });
    } catch (error) {
      console.error('[FileUpload] File upload error:', error);
      toast({
        variant: 'destructive',
        title: 'File Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload your file. Please try again.',
      });
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
    isDraggingOver,
    handleFileSelect,
    fileUploadHandlers,
  };
}
