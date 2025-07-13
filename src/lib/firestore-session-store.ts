
// src/lib/firestore-session-store.ts
import { Session, SessionStore } from 'genkit';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreSessionStore implements SessionStore {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('FirestoreSessionStore requires a userId.');
    }
    this.userId = userId;
  }

  private getSessionRef(sessionId: string) {
    // Correctly point to the nested chats subcollection
    return doc(db, 'users', this.userId, 'chats', sessionId);
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
    
    // Ensure the userId is part of the data being saved for security rules
    const dataToSave = {
      ...JSON.parse(JSON.stringify(sessionData)),
      userId: this.userId, 
      updatedAt: serverTimestamp() // Use Firestore server timestamp
    };

    await setDoc(sessionRef, dataToSave, { merge: true });
  }
}
