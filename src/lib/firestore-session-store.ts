
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
    return doc(db, 'users', this.userId, 'chats', sessionId);
  }

  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    const sessionRef = this.getSessionRef(sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      // Firestore Timestamps are automatically handled by Firestore SDK in many cases,
      // but if you store them as `serverTimestamp()`, they might need conversion on retrieval.
      // For Genkit's state, ensure data is JSON-serializable.
      // We are assuming the data in Firestore is compatible with SessionData<S>.
      // The 'updatedAt' field from the old implementation is part of Genkit's session management.
      return data as SessionData<S>;
    }
    return undefined;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    const sessionRef = this.getSessionRef(sessionId);
    
    // Ensure the userId is part of the data being saved for security rules
    const dataToSave = {
      ...JSON.parse(JSON.stringify(sessionData)),
      userId: this.userId, 
      updatedAt: serverTimestamp(), // Let Firestore manage the timestamp
    };

    await setDoc(sessionRef, dataToSave, { merge: true });
  }
}
