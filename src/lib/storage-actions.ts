'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

/**
 * Uploads a file to a user-specific folder in Firebase Storage.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns An object containing the public download URL and file metadata.
 */
export async function uploadFileToStorage(file: File, userId: string): Promise<{ downloadURL: string, fileName: string, fileType: string }> {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload.');
  }
  
  const filePath = `users/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    downloadURL,
    fileName: file.name,
    fileType: file.type,
  };
}
