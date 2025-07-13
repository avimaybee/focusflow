// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This ensures we only initialize the app once
if (!admin.apps.length) {
  try {
    // When running in a Firebase-managed environment, initialization is automatic.
    // For local development, you'd need service account credentials.
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const app = admin.apps[0]!;
export const db = getFirestore(app);
export const auth = getAuth(app);
