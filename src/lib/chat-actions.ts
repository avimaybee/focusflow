
'use server';

import { supabase, createAuthenticatedSupabaseClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ChatHistoryItem } from '@/hooks/use-chat-history';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { marked } from 'marked';

export async function getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title || 'Untitled Chat',
    createdAt: new Date(item.created_at),
  }));
}

export async function getChatMessages(sessionId: string, accessToken?: string): Promise<ChatMessageProps[]> {
    if (!sessionId) return [];

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    const { data, error } = await client
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    }

    const messages = await Promise.all(data.map(async (message) => ({
        id: message.id,
        role: message.role as 'user' | 'model',
        text: await marked.parse(message.content),
        rawText: message.content,
        createdAt: new Date(message.created_at),
    })));

    return messages;
}

/**
 * Create a new chat session for the authenticated user.
 * @param userId - The user's ID
 * @param title - The chat session title
 * @param accessToken - Optional access token for authenticated requests (required for Edge runtime)
 * @returns The new session ID or null on failure
 */
export async function createChatSession(userId: string, title: string, accessToken?: string): Promise<string | null> {
    if (!userId) {
        console.error('[createChatSession] Missing userId');
        return null;
    }

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    console.log('[createChatSession] Attempting to create session', { userId, title, hasToken: !!accessToken });

    const { data, error } = await client
        .from('chat_sessions')
        .insert({ user_id: userId, title: title })
        .select('id')
        .single();

    if (error) {
        console.error('[createChatSession] Error creating chat session:', error);
        console.error('[createChatSession] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        return null;
    }

    console.log('[createChatSession] Successfully created session', { sessionId: data.id });
    return data.id;
}

export async function addChatMessage(sessionId: string, role: 'user' | 'model', content: string, accessToken?: string) {
    if (!sessionId) return;

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    const { error } = await client
        .from('chat_messages')
        .insert({ session_id: sessionId, role, content });

    if (error) {
        console.error('Error adding chat message:', error);
    }
}
