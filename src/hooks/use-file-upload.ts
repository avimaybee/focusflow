
import { useState, DragEvent, Dispatch } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { uploadFileToStorage } from '@/lib/storage-actions';

export type Attachment = {
  name: string;
  type: string;
  path: string; // Now stores the gs:// path
};

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
      title: 'Uploading...',
      description: `Your file "${file.name}" is being uploaded.`,
    });

    try {
      const { gsPath, fileName, fileType } = await uploadFileToStorage(file, user.uid);
      const newAttachment = {
        name: fileName,
        type: fileType,
        path: gsPath,
      };
      // Dispatch to add the attachment to the temporary client state for display
      dispatch({ type: 'SET_ATTACHMENTS', payload: [newAttachment] });
      toast({
        id: toastId,
        variant: 'default',
        title: 'Upload Successful',
        description: `"${file.name}" is ready.`,
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        id: toastId,
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload your file. Please try again.',
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
