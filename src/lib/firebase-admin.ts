// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This ensures we only initialize the app once
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const app = admin.apps[0]!;
