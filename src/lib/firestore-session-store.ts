// src/lib/firestore-session-store.ts
import { SessionData, SessionStore } from 'genkit/beta';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreSessionStore<S = any> implements SessionStore<S> {
  private getSessionRef(sessionId: string) {
    const [userId, chatSessionId] = sessionId.split('_');
    if (!userId || !chatSessionId) {
      throw new Error('Invalid session ID format. Expected "userId_chatSessionId".');
    }
    return doc(db, 'users', userId, 'sessions', chatSessionId);
  }

  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    const sessionRef = this.getSessionRef(sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      return sessionSnap.data() as SessionData<S>;
    }
    return undefined;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    const sessionRef = this.getSessionRef(sessionId);
    await setDoc(sessionRef, { ...sessionData, updatedAt: new Date() });
  }
}
