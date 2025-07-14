// src/lib/firebase-admin.ts
console.log('DEBUG: Loading /lib/firebase-admin.ts module');

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

console.log('DEBUG: /lib/firebase-admin.ts - Imports processed.');

// This ensures we only initialize the app once
if (!admin.apps.length) {
  console.log('DEBUG: Firebase admin app not initialized. Initializing...');
  try {
    // When running in a Firebase-managed environment, initialization is automatic.
    // For local development, you'd need service account credentials.
    admin.initializeApp();
    console.log('DEBUG: Firebase admin app initialized successfully.');
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
} else {
  console.log('DEBUG: Firebase admin app already initialized.');
}

export const app = admin.apps[0]!;
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log('DEBUG: Firebase admin exports created.');
