'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const NOTES_DOC_PATH = 'main_notes'; // A single document for all notes

/**
 * Retrieves the user's notes content from Firestore.
 * @param userId The ID of the user.
 * @returns The content of the user's notes or an empty string.
 */
export async function getNotes(userId: string): Promise<string> {
  if (!userId) return '';
  try {
    const notesRef = db.collection('users').doc(userId).collection('notes').doc(NOTES_DOC_PATH);
    const doc = await notesRef.get();
    if (doc.exists) {
      return doc.data()?.content || '';
    }
    return '';
  } catch (error) {
    console.error(`Error getting notes for user ${userId}:`, error);
    // In case of error, return empty string to not block the user.
    return '';
  }
}

/**
 * Appends a snippet of text to the user's main notes document.
 * @param userId The ID of the user.
 * @param snippet The text snippet to append.
 */
export async function appendToNotes(userId: string, snippet: string): Promise<void> {
  if (!userId || !snippet) return;
  try {
    const notesRef = db.collection('users').doc(userId).collection('notes').doc(NOTES_DOC_PATH);
    const doc = await notesRef.get();
    
    const currentContent = doc.exists ? doc.data()?.content || '' : '';
    const newContent = `${currentContent}\n\n---\n\n${snippet}`;

    await notesRef.set({
      content: newContent,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

  } catch (error) {
    console.error(`Error appending to notes for user ${userId}:`, error);
    throw new Error('Failed to save to notes.');
  }
}

/**
 * Saves the user's notes content to Firestore.
 * @param userId The ID of the user.
 * @param content The new content to save.
 */
export async function saveNotes(userId: string, content: string): Promise<void> {
  if (!userId) return;
  try {
    const notesRef = db.collection('users').doc(userId).collection('notes').doc(NOTES_DOC_PATH);
    await notesRef.set({
      content: content,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving notes for user ${userId}:`, error);
    // Re-throw the error to be caught by the front-end for user feedback.
    throw new Error('Failed to save notes.');
  }
}