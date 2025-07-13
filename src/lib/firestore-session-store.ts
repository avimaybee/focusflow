
// src/lib/firestore-session-store.ts
import { Message, Session, SessionStore } from 'genkit';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreSessionStore implements SessionStore {
  private getSessionRef(sessionId: string) {
    return doc(db, 'sessions', sessionId);
  }

  async get(sessionId: string): Promise<Session | undefined> {
    const sessionRef = this.getSessionRef(sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      // Firestore Timestamps need to be converted back to Date objects for Genkit
      const history = (data.history || []).map((msg: any) => ({
        ...msg,
        // Convert any Firestore Timestamps inside message content back to Dates if they exist
      }));
      return { ...data, history, updatedAt: data.updatedAt?.toDate() } as Session;
    }
    return undefined;
  }

  async save(sessionId: string, sessionData: Session): Promise<void> {
    const sessionRef = this.getSessionRef(sessionId);
    
    const plainSessionData = JSON.parse(JSON.stringify(sessionData));

    await setDoc(sessionRef, {
      ...plainSessionData,
      updatedAt: serverTimestamp() // Use Firestore server timestamp
    }, { merge: true });
  }
}
