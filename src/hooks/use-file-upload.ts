
'use client';

import { useState, DragEvent, Dispatch } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export type Attachment = {
  name: string;
  type: string;
  // path now stores the data URI instead of a gs:// path
  path: string; 
};

/**
 * Reads a file and converts it to a data URI.
 * @param file The file to read.
 * @returns A promise that resolves with the data URI.
 */
function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export function useFileUpload(dispatch: Dispatch<any>) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file || !user?.uid) return;

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
      title: 'Processing...',
      description: `Your file "${file.name}" is being prepared.`,
    });

    try {
      // Convert file to data URI on the client
      const dataUri = await fileToDataUri(file);
      
      const newAttachment: Attachment = {
        name: file.name,
        type: file.type,
        path: dataUri, // The path now holds the full data URI
      };
      
      // Dispatch to add the attachment to the temporary client state for display
      dispatch({ type: 'SET_ATTACHMENTS', payload: [newAttachment] });

      toast({
        id: toastId,
        variant: 'default',
        title: 'File Ready',
        description: `"${file.name}" is attached.`,
      });

    } catch (error) {
      console.error("File processing error:", error);
      toast({
        id: toastId,
        variant: 'destructive',
        title: 'File Error',
        description: 'Could not process your file. Please try again.',
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
