// Edge-compatible chat actions for use in API routes
// These don't use 'use server' directive and work in Edge runtime

import { createClient } from '@supabase/supabase-js';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { marked } from 'marked';

// Helper function to get Supabase credentials with error checking
function getSupabaseCredentials() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Supabase] Missing environment variables!');
        console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
        console.error('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
        throw new Error('Missing Supabase URL or Anon Key environment variables.');
    }

    return { supabaseUrl, supabaseAnonKey };
}

/**
 * Get chat messages for a session (Edge-compatible)
 */
export async function getChatMessages(sessionId: string, authToken?: string): Promise<ChatMessageProps[]> {
    if (!sessionId) {
        console.warn('[getChatMessages] No sessionId provided');
        return [];
    }

    try {
        const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
        
        // Create a Supabase client with optional auth token
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, 
            authToken ? {
                global: {
                    headers: {
                        Authorization: authToken,
                    },
                },
            } : undefined
        );

        const { data, error } = await supabaseClient
            .from('chat_messages')
            .select('id, role, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[getChatMessages] Error fetching chat messages:', error);
            return [];
        }

        if (!data) {
            console.warn('[getChatMessages] No data returned for sessionId:', sessionId);
            return [];
        }

        const messages = await Promise.all(data.map(async (message) => ({
            id: message.id,
            role: message.role as 'user' | 'model',
            text: await marked.parse(message.content),
            rawText: message.content,
            createdAt: new Date(message.created_at),
        })));

        console.log('[getChatMessages] Successfully fetched', messages.length, 'messages for session:', sessionId);
        return messages;
    } catch (error) {
        console.error('[getChatMessages] Unexpected error:', error);
        return [];
    }
}

/**
 * Create a new chat session (Edge-compatible)
 */
export async function createChatSession(userId: string, title: string, authToken?: string): Promise<string | null> {
    if (!userId) {
        console.error('[createChatSession] No userId provided');
        return null;
    }

    try {
        console.log('[createChatSession] Creating session for userId:', userId, 'with title:', title, 'hasToken:', !!authToken);
        
        const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
        
        // Create a Supabase client with optional auth token
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey,
            authToken ? {
                global: {
                    headers: {
                        Authorization: authToken,
                    },
                },
            } : undefined
        );

        const { data, error } = await supabaseClient
            .from('chat_sessions')
            .insert({ user_id: userId, title: title })
            .select('id')
            .single();

        if (error) {
            console.error('[createChatSession] Error creating chat session:', error);
            console.error('[createChatSession] Error code:', error.code, 'Message:', error.message, 'Details:', error.details);
            return null;
        }

        if (!data) {
            console.error('[createChatSession] No data returned from insert');
            return null;
        }

        console.log('[createChatSession] Successfully created session:', data.id);
        return data.id;
    } catch (error) {
        console.error('[createChatSession] Unexpected error:', error);
        if (error instanceof Error) {
            console.error('[createChatSession] Error message:', error.message);
            console.error('[createChatSession] Error stack:', error.stack);
        }
        return null;
    }
}

/**
 * Add a message to a chat session (Edge-compatible)
 */
export async function addChatMessage(sessionId: string, role: 'user' | 'model', content: string, authToken?: string): Promise<boolean> {
    if (!sessionId) {
        console.error('[addChatMessage] No sessionId provided');
        return false;
    }

    try {
        const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
        
        // Create a Supabase client with optional auth token
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey,
            authToken ? {
                global: {
                    headers: {
                        Authorization: authToken,
                    },
                },
            } : undefined
        );

        const { error } = await supabaseClient
            .from('chat_messages')
            .insert({ session_id: sessionId, role, content });

        if (error) {
            console.error('[addChatMessage] Error adding chat message:', error);
            return false;
        }

        console.log('[addChatMessage] Successfully added message to session:', sessionId);
        return true;
    } catch (error) {
        console.error('[addChatMessage] Unexpected error:', error);
        return false;
    }
}
