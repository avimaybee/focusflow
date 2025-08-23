// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This ensures we only initialize the app once
if (!admin.apps.length) {
  console.log('DEBUG: Firebase admin app not initialized. Initializing...');
  try {
    // When running locally, it will use the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable. When deployed, it will use Application Default Credentials.
    admin.initializeApp();
    console.log('DEBUG: Firebase admin app initialized successfully.');
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
    // Provide a more helpful error message
    if (error.code === 'app/invalid-credential') {
      console.error(
        '***********************************************************************\n' +
        'FATAL: Could not initialize Firebase Admin SDK. \n' +
        'Please ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable\n' +
        'is set correctly and points to a valid service account JSON file.\n' +
        '***********************************************************************'
      );
    }
  }
} else {
  console.log('DEBUG: Firebase admin app already initialized.');
}


export { FieldValue } from 'firebase-admin/firestore';

export const app = admin.apps[0]!;
export const db = getFirestore(app);
export const auth = getAuth(app);
