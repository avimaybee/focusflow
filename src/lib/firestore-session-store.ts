
import { SessionStore, SessionData } from 'genkit/beta';
import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export class FirestoreSessionStore<S = any> implements SessionStore<S> {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private getSessionRef(sessionId: string) {
    return db.collection('users').doc(this.userId).collection('chats').doc(sessionId);
  }

  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    console.log(`SESSION STORE (GET): Getting session '${sessionId}' for user '${this.userId}'`);
    const docRef = this.getSessionRef(sessionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`SESSION STORE (GET): Session not found.`);
      return undefined;
    }

    const data = docSnap.data();
    if (!data) {
        console.log(`SESSION STORE (GET): Session data is empty.`);
        return undefined;
    }

    // Convert Firestore Timestamps back to Dates for Genkit. This is critical.
    const history = (data.history || []).map((msg: any) => {
        if (msg.timestamp && msg.timestamp instanceof Timestamp) {
            return { ...msg, timestamp: msg.timestamp.toDate() };
        }
        return msg;
    });
    
    const sessionData: SessionData<S> = {
      history,
      state: data.state,
      id: docSnap.id,
    };

    console.log(`SESSION STORE (GET): Session loaded successfully.`);
    return sessionData;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    console.log(`SESSION STORE (SAVE): Saving session '${sessionId}' for user '${this.userId}'`);
    const docRef = this.getSessionRef(sessionId);

    // Find the first user message to use as a title
    const firstUserMessage = sessionData.history?.find((m: any) => m.role === 'user');
    let title = 'New Chat';
    if (firstUserMessage) {
        const textPart = firstUserMessage.content.find((p: any) => p.text);
        if (textPart?.text) {
          title = textPart.text.substring(0, 50);
        } else {
            const mediaPart = firstUserMessage.content.find((p: any) => p.media);
            if(mediaPart) {
                title = 'Chat with media';
            }
        }
    }
    
    // Convert Dates back to Firestore Timestamps for storage
    const historyToSave = (sessionData.history || []).map((msg: any) => {
        if (msg.timestamp && msg.timestamp instanceof Date) {
            return { ...msg, timestamp: Timestamp.fromDate(msg.timestamp) };
        }
        return msg;
    });

    const dataToSave = {
      ...sessionData,
      history: historyToSave,
      title: title,
      updatedAt: Timestamp.now(),
    };

    await docRef.set(dataToSave, { merge: true });
    console.log(`SESSION STORE (SAVE): Session saved successfully.`);
  }
}
