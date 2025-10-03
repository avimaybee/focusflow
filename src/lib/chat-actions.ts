'use server';

import { supabase } from './supabase';
import { z } from 'zod';
import { AuthError, PostgrestError } from '@supabase/supabase-js';

// Define Zod schemas for validation
const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.string(),
  content: z.string(),
  created_at: z.string(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// --- CHAT SESSION ACTIONS ---

/**
 * Creates a new chat session for a user.
 * @param userId - The UUID of the user.
 * @param title - An optional title for the chat session.
 * @returns The newly created chat session.
 */
export async function createChatSession(userId: string, title?: string): Promise<{ data: ChatSession | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, title: title || 'New Chat' })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat session:', error);
    return { data: null, error };
  }

  const validation = ChatSessionSchema.safeParse(data);
  if (!validation.success) {
    console.error('Validation failed for created chat session:', validation.error);
    return { data: null, error: { message: 'Invalid data shape from database.', details: validation.error.toString(), hint: '', code: '' } as PostgrestError };
  }

  return { data: validation.data, error: null };
}

/**
 * Retrieves a single chat session by its ID.
 * @param sessionId - The UUID of the chat session.
 * @returns The requested chat session.
 */
export async function getChatSession(sessionId: string): Promise<{ data: ChatSession | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error(`Error fetching chat session ${sessionId}:`, error);
    return { data: null, error };
  }

  const validation = ChatSessionSchema.safeParse(data);
  if (!validation.success) {
    console.error('Validation failed for fetched chat session:', validation.error);
    return { data: null, error: { message: 'Invalid data shape from database.', details: validation.error.toString(), hint: '', code: '' } as PostgrestError };
  }

  return { data: validation.data, error: null };
}

/**
 * Retrieves all chat sessions for a specific user.
 * @param userId - The UUID of the user.
 * @returns A list of chat sessions.
 */
export async function getChatSessions(userId: string): Promise<{ data: ChatSession[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(`Error fetching chat sessions for user ${userId}:`, error);
    return { data: null, error };
  }

  const validation = z.array(ChatSessionSchema).safeParse(data);
  if (!validation.success) {
    console.error('Validation failed for chat sessions list:', validation.error);
    return { data: null, error: { message: 'Invalid data shape from database.', details: validation.error.toString(), hint: '', code: '' } as PostgrestError };
  }

  return { data: validation.data, error: null };
}

// --- CHAT MESSAGE ACTIONS ---

/**
 * Adds a new message to a chat session.
 * @param sessionId - The UUID of the chat session.
 * @param role - The role of the message sender ('user' or 'model').
 * @param content - The text content of the message.
 * @returns The newly created chat message.
 */
export async function addMessageToChat(sessionId: string, role: 'user' | 'model', content: string): Promise<{ data: ChatMessage | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })
    .select()
    .single();

  if (error) {
    console.error(`Error adding message to session ${sessionId}:`, error);
    return { data: null, error };
  }

  // Also update the updated_at timestamp of the parent session
  const { error: updateError } = await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (updateError) {
    console.error(`Error updating session timestamp for ${sessionId}:`, updateError);
    // Non-critical error, so we don't return it, just log it.
  }

  const validation = ChatMessageSchema.safeParse(data);
  if (!validation.success) {
    console.error('Validation failed for new chat message:', validation.error);
    return { data: null, error: { message: 'Invalid data shape from database.', details: validation.error.toString(), hint: '', code: '' } as PostgrestError };
  }

  return { data: validation.data, error: null };
}

/**
 * Retrieves all messages for a specific chat session.
 * @param sessionId - The UUID of the chat session.
 * @returns A list of chat messages.
 */
export async function getMessagesForSession(sessionId: string): Promise<{ data: ChatMessage[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching messages for session ${sessionId}:`, error);
    return { data: null, error };
  }

  const validation = z.array(ChatMessageSchema).safeParse(data);
  if (!validation.success) {
    console.error('Validation failed for message list:', validation.error);
    return { data: null, error: { message: 'Invalid data shape from database.', details: validation.error.toString(), hint: '', code: '' } as PostgrestError };
  }

  return { data: validation.data, error: null };
}