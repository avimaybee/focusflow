/* eslint-disable @typescript-eslint/no-explicit-any */
import { SessionStore, SessionData } from 'genkit/beta';
import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to recursively convert Firestore Timestamps to JS Dates
function convertTimestampsToDates(data: any): any {
  if (!data) return data;
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestampsToDates);
  }
  if (typeof data === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      newObj[key] = convertTimestampsToDates(data[key]);
    }
    return newObj;
  }
  return data;
}

// Helper function to recursively convert JS Dates to Firestore Timestamps
function convertDatesToTimestamps(data: any): any {
  if (!data) return data;
  if (data instanceof Date) {
    return Timestamp.fromDate(data);
  }
  if (Array.isArray(data)) {
    return data.map(convertDatesToTimestamps);
  }
  if (typeof data === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      newObj[key] = convertDatesToTimestamps(data[key]);
    }
    return newObj;
  }
  return data;
}


export class FirestoreSessionStore<S = any> implements SessionStore<S> {
  private collection: FirebaseFirestore.CollectionReference;

  constructor(userId: string, options?: { isGuest?: boolean }) {
    if (options?.isGuest) {
      this.collection = db.collection('guestChats').doc(userId).collection('chats');
    } else {
      this.collection = db.collection('users').doc(userId).collection('chats');
    }
  }

  private getSessionRef(sessionId: string) {
    return this.collection.doc(sessionId);
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

    // Recursively convert all Firestore Timestamps to Dates for Genkit
    const sessionData = convertTimestampsToDates(data) as SessionData<S>;
    sessionData.id = docSnap.id;


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
    
    const sessionDataCopy = { ...sessionData };

    // THE FIX: Explicitly remove the state property if it is undefined.
    if (sessionDataCopy.state === undefined) {
      delete (sessionDataCopy as Partial<SessionData<S>>).state;
    }

    // Deep convert Dates to Timestamps before saving
    const dataToSave = convertDatesToTimestamps({
        ...sessionDataCopy,
        history: sessionData.history || [], // Ensure history is always present
        title: title,
        updatedAt: new Date(), // Will be converted to Timestamp
    });

    // Add createdAt timestamp robustly if it's a new document
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        dataToSave.createdAt = new Date(); // Will be converted to Timestamp
    }

    await docRef.set(dataToSave, { merge: true });
    console.log(`SESSION STORE (SAVE): Session saved successfully.`);
  }
}