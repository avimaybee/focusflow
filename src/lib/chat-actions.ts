
'use server';

import { supabase, createAuthenticatedSupabaseClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ChatHistoryItem } from '@/hooks/use-chat-history';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { marked } from 'marked';
import { buildGeminiProxyUrl } from '@/lib/attachment-utils';

const renameChatSchema = z.object({
    title: z
        .string({ required_error: 'Title is required.' })
        .trim()
        .min(1, 'Title cannot be empty.')
        .max(120, 'Title must be 120 characters or fewer.'),
});

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

  if (!data) {
    console.warn('getChatHistory: No data returned for userId:', userId);
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
        .select('id, role, content, attachments, persona_id, created_at, selected_by_auto, auto_selected_persona_id, auto_confidence, auto_selection_method')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    }

    if (!data) {
        console.warn('getChatMessages: No data returned for sessionId:', sessionId);
        return [];
    }

    const messages = await Promise.all(data.map(async (message) => {
        // Fetch persona details if auto-selected
        let autoSelectedPersonaName: string | undefined;
        if (message.selected_by_auto && message.auto_selected_persona_id) {
            try {
                const { data: personaData } = await client
                    .from('personas')
                    .select('name')
                    .eq('id', message.auto_selected_persona_id)
                    .single();
                
                autoSelectedPersonaName = personaData?.name;
            } catch (err) {
                console.warn('Failed to fetch auto-selected persona name:', err);
            }
        }

        return {
            id: message.id,
            role: message.role as 'user' | 'model',
            text: await marked.parse(message.content),
            rawText: message.content,
            personaId: message.persona_id,
            createdAt: new Date(message.created_at),
            selectedByAuto: message.selected_by_auto || false,
            autoSelectedPersonaId: message.auto_selected_persona_id || undefined,
            autoSelectedPersonaName,
            attachments: Array.isArray(message.attachments)
                ? message.attachments.reduce<NonNullable<ChatMessageProps['attachments']>>((acc, raw) => {
                    if (!raw || typeof raw !== 'object') {
                        return acc;
                    }

                    const remoteUrl = typeof raw.url === 'string' ? raw.url : undefined;
                    const proxiedUrl = remoteUrl ? buildGeminiProxyUrl(remoteUrl) : '';
                    const name = typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : 'attachment';
                    const mimeType = typeof raw.mimeType === 'string' ? raw.mimeType : typeof raw.contentType === 'string' ? raw.contentType : 'application/octet-stream';

                    let sizeValue: number | undefined;
                    if (typeof raw.sizeBytes === 'number') {
                        sizeValue = raw.sizeBytes;
                    } else if (typeof raw.size === 'number') {
                        sizeValue = raw.size;
                    } else if (typeof raw.sizeBytes === 'string') {
                        const parsed = Number.parseInt(raw.sizeBytes, 10);
                        if (Number.isFinite(parsed)) {
                            sizeValue = parsed;
                        }
                    }

                    const normalizedSize = typeof sizeValue === 'number' && Number.isFinite(sizeValue) ? Math.max(0, sizeValue) : 0;

                    if (!remoteUrl && !proxiedUrl) {
                        return acc;
                    }

                    acc.push({
                        url: proxiedUrl || remoteUrl || '',
                        remoteUrl,
                        name,
                        contentType: mimeType,
                        size: normalizedSize,
                    });
                    return acc;
                }, [])
                : undefined,
        };
    }));

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

export interface AutoSelectionMetadata {
  selectedByAuto: boolean;
  autoSelectedPersonaId: string;
  autoConfidence: number;
  autoSelectionMethod: 'explicit' | 'semantic' | 'fallback' | 'default';
}

export async function addChatMessage(
    sessionId: string,
    role: 'user' | 'model',
    content: string,
    accessToken?: string,
    attachments?: Array<{ url: string; name: string; mimeType: string; sizeBytes: string }>,
    personaId?: string,
    autoSelection?: AutoSelectionMetadata
) {
    if (!sessionId) return false;

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    const messageData: any = {
        session_id: sessionId,
        role,
        content,
        attachments: attachments && attachments.length > 0 ? attachments : [],
        persona_id: personaId,
    };

    // Add auto-selection metadata if provided
    if (autoSelection) {
        messageData.selected_by_auto = autoSelection.selectedByAuto;
        messageData.auto_selected_persona_id = autoSelection.autoSelectedPersonaId;
        messageData.auto_confidence = autoSelection.autoConfidence;
        messageData.auto_selection_method = autoSelection.autoSelectionMethod;
    }

    const { data, error } = await client
        .from('chat_messages')
        .insert(messageData)
        .select('id')
        .single();

    if (error) {
        console.error('Error adding chat message:', error);
        return false;
    }

    if (!data) {
        console.warn('addChatMessage: insert returned no data for sessionId:', sessionId);
        return false;
    }

    return true;
}

/**
 * Delete a chat session and all its messages
 * @param userId - The user's ID
 * @param chatId - The chat session ID to delete
 * @param accessToken - Optional access token for authenticated requests
 * @returns Success status
 */
export async function deleteChatSession(userId: string, chatId: string, accessToken?: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !chatId) {
        console.error('[deleteChatSession] Missing userId or chatId');
        return { success: false, error: 'Missing required parameters' };
    }

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    console.log('[deleteChatSession] Attempting to delete session', { userId, chatId, hasToken: !!accessToken });

    // First verify the chat belongs to the user
    const { data: session, error: fetchError } = await client
        .from('chat_sessions')
        .select('id')
        .eq('id', chatId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !session) {
        console.error('[deleteChatSession] Chat not found or unauthorized:', fetchError);
        return { success: false, error: 'Chat not found or unauthorized' };
    }

    // Delete all messages in the chat session (cascade should handle this, but being explicit)
    const { error: messagesError } = await client
        .from('chat_messages')
        .delete()
        .eq('session_id', chatId);

    if (messagesError) {
        console.error('[deleteChatSession] Error deleting messages:', messagesError);
        // Continue anyway, cascade delete should handle it
    }

    // Delete the chat session
    const { error: sessionError } = await client
        .from('chat_sessions')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

    if (sessionError) {
        console.error('[deleteChatSession] Error deleting chat session:', sessionError);
        return { success: false, error: sessionError.message };
    }

    console.log('[deleteChatSession] Successfully deleted chat:', chatId);
    return { success: true };
}

export async function renameChatSession(
    userId: string,
    chatId: string,
    newTitle: string,
    accessToken?: string,
): Promise<{ success: boolean; error?: string; title?: string }> {
    if (!userId || !chatId) {
        return { success: false, error: 'Missing required parameters.' };
    }

    const parsed = renameChatSchema.safeParse({ title: newTitle });
    if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? 'Invalid title.';
        return { success: false, error: message };
    }

    const client = accessToken ? createAuthenticatedSupabaseClient(accessToken) : supabase;

    try {
        const { data, error } = await client
            .from('chat_sessions')
            .update({ title: parsed.data.title })
            .eq('id', chatId)
            .eq('user_id', userId)
            .select('title')
            .single();

        if (error) {
            console.error('[renameChatSession] Supabase error:', error);
            return { success: false, error: error.message || 'Failed to rename chat.' };
        }

        if (!data) {
            console.error('[renameChatSession] No data returned after update', { chatId, userId });
            return { success: false, error: 'Chat not found or unauthorized.' };
        }

        return { success: true, title: data.title ?? parsed.data.title };
    } catch (error) {
        console.error('[renameChatSession] Unexpected error:', error);
        return { success: false, error: 'Unexpected error renaming chat.' };
    }
}
