
// src/lib/firestore-session-store.ts
import { SessionData, SessionStore } from 'genkit/beta';
import { serverTimestamp } from 'firebase-admin/firestore';
import { db } from './firebase-admin'; // Use Firebase Admin SDK

// Define a type for your session state if you have one.
// For now, we can use `any`.
type MyState = any;

export class FirestoreSessionStore<S = MyState> implements SessionStore<S> {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('FirestoreSessionStore requires a userId.');
    }
    this.userId = userId;
  }

  private getSessionRef(sessionId: string) {
    // This correctly points to the subcollection within a user's document
    return db.collection('users').doc(this.userId).collection('chats').doc(sessionId);
  }

  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    const sessionRef = this.getSessionRef(sessionId);
    const sessionSnap = await sessionRef.get();

    if (sessionSnap.exists) {
      const data = sessionSnap.data();
      // Firestore Timestamps need to be handled carefully if they exist in state.
      // Genkit's core session data is JSON-serializable.
      return data as SessionData<S>;
    }
    return undefined;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    const sessionRef = this.getSessionRef(sessionId);
    
    // Ensure the data is clean and add/update metadata for Firestore.
    // JSON.parse(JSON.stringify(...)) is a robust way to strip non-serializable data.
    const dataToSave = {
      ...JSON.parse(JSON.stringify(sessionData)),
      userId: this.userId, 
      updatedAt: serverTimestamp(),
    };

    await sessionRef.set(dataToSave, { merge: true });
  }
}
