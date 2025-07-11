
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage.
 * @param userId The ID of the user uploading the file.
 * @param fileDataUrl The file represented as a data URL.
 * @param fileName The name of the file.
 * @returns The public download URL of the uploaded file.
 */
export async function uploadFile(
  userId: string,
  fileDataUrl: string,
  fileName: string
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required for file upload.');
  }

  const fileId = uuidv4();
  const storageRef = ref(storage, `user-uploads/${userId}/${fileId}-${fileName}`);
  
  // Upload the file from the data URL
  const snapshot = await uploadString(storageRef, fileDataUrl, 'data_url');
  
  // Get the public URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
