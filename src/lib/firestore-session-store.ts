// src/lib/firestore-session-store.ts
import { SessionData, SessionStore } from 'genkit/beta';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreSessionStore<S = any> implements SessionStore<S> {
  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      return sessionSnap.data() as SessionData<S>;
    }
    return undefined;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    const sessionRef = doc(db, 'sessions', sessionId);
    await setDoc(sessionRef, sessionData);
  }
}
