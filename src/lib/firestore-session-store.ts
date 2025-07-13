
// src/lib/firestore-session-store.ts
import { SessionData, SessionStore } from 'genkit/beta';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

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
    return doc(db, 'users', this.userId, 'chats', sessionId);
  }

  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    const sessionRef = this.getSessionRef(sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
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

    await setDoc(sessionRef, dataToSave, { merge: true });
  }
}
