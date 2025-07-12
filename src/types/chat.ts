/**
 * @fileoverview Defines the core data structures for chat messages.
 * This structure is used consistently across the frontend, backend, and Firestore.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'model'; // Gemini API requires 'user' or 'model'
  text: string;
  timestamp: number;
  isGenerating?: boolean; // Frontend-only: indicates AI thinking
  isError?: boolean;      // Frontend-only: indicates API error
  // For Firestore storage of AI-generated content
  flashcards?: any[];
  quiz?: any;
}
