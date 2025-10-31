// Edge-compatible chat actions for use in API routes
// These don't use 'use server' directive and work in Edge runtime

import { supabase, createAuthenticatedSupabaseClient } from './supabase';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { marked } from 'marked';

/**
 * Get chat messages for a session (Edge-compatible)
 */
export async function getChatMessages(sessionId: string, authToken?: string): Promise<ChatMessageProps[]> {
    if (!sessionId) {
        console.warn('[getChatMessages] No sessionId provided');
        return [];
    }

    try {
        const supabaseClient = authToken ? createAuthenticatedSupabaseClient(authToken) : supabase;

        const { data, error } = await supabaseClient
            .from('chat_messages')
            .select('id, role, content, persona_id, created_at')
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
            personaId: message.persona_id,
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
        
        const supabaseClient = authToken ? createAuthenticatedSupabaseClient(authToken) : supabase;

        // First, verify the profile exists for this user
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) {
            console.error('[createChatSession] Error checking profile:', profileError);
        }

        if (!profileData) {
            console.error('[createChatSession] Profile not found for userId:', userId);
            console.error('[createChatSession] This user may need to have their profile created first');
            // Try to create the profile
            const { error: createProfileError } = await supabaseClient
                .from('profiles')
                .insert({ id: userId, username: null });
            
            if (createProfileError) {
                console.error('[createChatSession] Failed to create profile:', createProfileError);
            } else {
                console.log('[createChatSession] Successfully created missing profile for user:', userId);
            }
        }

        const { data, error } = await supabaseClient
            .from('chat_sessions')
            .insert({ user_id: userId, title: title })
            .select('id')
            .single();

        if (error) {
            console.error('[createChatSession] Error creating chat session:', error);
            console.error('[createChatSession] Error code:', error.code, 'Message:', error.message, 'Details:', error.details);
            
            // Additional debugging
            if (error.code === '42501') { // PostgreSQL insufficient privilege error
                console.error('[createChatSession] RLS policy may be rejecting the insert. Check:');
                console.error('[createChatSession] 1. Is the auth token valid?');
                console.error('[createChatSession] 2. Does auth.uid() match userId?', userId);
            }
            
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
export async function addChatMessage(
    sessionId: string,
    role: 'user' | 'model',
    content: string,
    authToken?: string,
    attachments?: Array<{ url: string; name: string; mimeType: string; sizeBytes: string }>,
    personaId?: string
): Promise<boolean> {
    if (!sessionId) {
        console.error('[addChatMessage] No sessionId provided');
        return false;
    }

    try {
        const supabaseClient = authToken ? createAuthenticatedSupabaseClient(authToken) : supabase;

        const { error } = await supabaseClient
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role,
                content,
                attachments: attachments && attachments.length > 0 ? attachments : [],
                persona_id: personaId,
            });

        if (error) {
            console.error('[addChatMessage] Error adding chat message:', error);
            return false;
        }

        console.log('[addChatMessage] Successfully added message to session:', sessionId, 'with persona:', personaId);
        return true;
    } catch (error) {
        console.error('[addChatMessage] Unexpected error:', error);
        return false;
    }
}
