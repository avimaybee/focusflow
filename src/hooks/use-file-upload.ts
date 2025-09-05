
'use client';

import { useState, DragEvent, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Attachment } from '@/types/chat-types';

export function useFileUpload(setAttachment: Dispatch<SetStateAction<Attachment | null>>) {
  const { toast } = useToast();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const readFileAsDataURI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('text/') && file.type !== 'application/pdf') {
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
        description: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    try {
      const dataUri = await readFileAsDataURI(file);
      const newAttachment: Attachment = {
        name: file.name,
        contentType: file.type,
        size: file.size,
        url: dataUri,
      };
      setAttachment(newAttachment);
    } catch (error) {
      console.error("File reading error:", error);
      toast({
        variant: 'destructive',
        title: 'File Read Failed',
        description: 'Could not read your file. Please try again.',
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
