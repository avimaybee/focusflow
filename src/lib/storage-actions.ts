
'use server';

import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

/**
 * Uploads a file to a user-specific folder in Firebase Storage.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns The gs:// path of the uploaded file.
 */
export async function uploadFileToStorage(file: File, userId: string): Promise<{ gsPath: string, fileName: string, fileType: string }> {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload.');
  }
  
  const filePath = `users/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  
  const gsPath = `gs://${storageRef.bucket}/${storageRef.fullPath}`;
  
  return {
    gsPath,
    fileName: file.name,
    fileType: file.type,
  };
}

