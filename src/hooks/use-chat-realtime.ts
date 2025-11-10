'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessageProps } from '@/components/chat/chat-message';
import { marked } from 'marked';
import { buildGeminiProxyUrl } from '@/lib/attachment-utils';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PersonaDetails } from '@/types/chat-types';

interface UseChatRealtimeOptions {
  sessionId: string | null;
  onMessageInsert: (message: ChatMessageProps) => void;
  personas?: PersonaDetails[];
  activePersona?: PersonaDetails;
  enabled?: boolean;
}

/**
 * Custom hook for subscribing to Supabase Realtime chat_messages INSERT events.
 * Handles deduplication, attachment parsing, and persona resolution.
 * 
 * @param options - Configuration options
 * @param options.sessionId - The chat session ID to subscribe to
 * @param options.onMessageInsert - Callback when a new message is inserted
 * @param options.personas - Array of available personas for resolving persona details
 * @param options.activePersona - Currently active persona as fallback
 * @param options.enabled - Whether the subscription is active (default: true)
 */
export function useChatRealtime({
  sessionId,
  onMessageInsert,
  personas = [],
  activePersona,
  enabled = true,
}: UseChatRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Transform DB row to ChatMessageProps with all necessary parsing
  const transformDbRow = useCallback(async (row: any): Promise<ChatMessageProps> => {
    // Parse attachments if present
    let attachments: ChatMessageProps['attachments'] = undefined;
    if (Array.isArray(row.attachments) && row.attachments.length > 0) {
      const parsedAttachments: NonNullable<ChatMessageProps['attachments']> = [];
      
      for (const raw of row.attachments) {
        if (!raw || typeof raw !== 'object') {
          continue;
        }

        const remoteUrl = typeof raw.url === 'string' ? raw.url : undefined;
        const proxiedUrl = remoteUrl ? buildGeminiProxyUrl(remoteUrl) : '';
        const name = typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : 'attachment';
        const mimeType = typeof raw.mimeType === 'string' 
          ? raw.mimeType 
          : typeof raw.contentType === 'string' 
            ? raw.contentType 
            : 'application/octet-stream';

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

        const normalizedSize = typeof sizeValue === 'number' && Number.isFinite(sizeValue) 
          ? Math.max(0, sizeValue) 
          : 0;

        if (!remoteUrl && !proxiedUrl) {
          continue;
        }

        parsedAttachments.push({
          url: proxiedUrl || remoteUrl || '',
          remoteUrl,
          name,
          contentType: mimeType,
          size: normalizedSize,
        });
      }

      if (parsedAttachments.length > 0) {
        attachments = parsedAttachments;
      }
    }

    // Resolve persona details
    let resolvedPersona: PersonaDetails | undefined;
    if (row.persona_id) {
      // Try to find persona in provided personas array
      const targetId = (row.persona_id as string).trim().toLowerCase();
      resolvedPersona = personas.find(p => p.id.trim().toLowerCase() === targetId);
      
      // Fallback to activePersona if IDs match
      if (!resolvedPersona && activePersona && activePersona.id.trim().toLowerCase() === targetId) {
        resolvedPersona = activePersona;
      }
    }

    // Parse content to HTML using marked
    const rawText = row.content || '';
    const htmlText = await marked.parse(rawText);

    // Handle auto-selection metadata
    let autoSelectedPersonaName: string | undefined;
    if (row.selected_by_auto && row.auto_selected_persona_id) {
      // Try to get persona name from personas array
      const autoPersona = personas.find(p => p.id === row.auto_selected_persona_id);
      autoSelectedPersonaName = autoPersona?.name;
    }

    return {
      id: row.id,
      role: row.role as 'user' | 'model',
      text: htmlText,
      rawText,
      personaId: row.persona_id || undefined,
      persona: resolvedPersona,
      createdAt: new Date(row.created_at),
      attachments,
      selectedByAuto: row.selected_by_auto || false,
      autoSelectedPersonaId: row.auto_selected_persona_id || undefined,
      autoSelectedPersonaName,
    };
  }, [personas, activePersona]);

  // Handle incoming INSERT payload
  const handleInsert = useCallback(async (payload: any) => {
    try {
      const row = payload.new;
      
      // Deduplicate by DB id
      if (processedIdsRef.current.has(row.id)) {
        console.debug('[Realtime] Skipping duplicate message', { id: row.id });
        return;
      }

      console.debug('[Realtime] Processing INSERT', {
        id: row.id,
        role: row.role,
        sessionId: row.session_id,
        hasAttachments: Array.isArray(row.attachments) && row.attachments.length > 0,
        personaId: row.persona_id,
      });

      // Mark as processed
      processedIdsRef.current.add(row.id);

      // Transform and callback
      const message = await transformDbRow(row);
      onMessageInsert(message);

      console.debug('[Realtime] Message inserted to UI', { id: message.id, role: message.role });
    } catch (error) {
      console.error('[Realtime] Error handling INSERT payload', error, payload);
    }
  }, [transformDbRow, onMessageInsert]);

  useEffect(() => {
    // Don't subscribe if disabled or no sessionId
    if (!enabled || !sessionId) {
      return;
    }

    console.debug('[Realtime] Setting up subscription', { sessionId });

    // Create channel with unique name
    const channel = supabase
      .channel(`chat-messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        handleInsert
      );

    // Subscribe to channel
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.debug('[Realtime] Successfully subscribed', { sessionId });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error', { sessionId, error: err });
      } else if (status === 'TIMED_OUT') {
        console.warn('[Realtime] Subscription timed out', { sessionId });
      } else {
        console.debug('[Realtime] Status change', { status, sessionId });
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.debug('[Realtime] Cleaning up subscription', { sessionId });
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clear processed IDs when chat changes
      processedIdsRef.current.clear();
    };
  }, [sessionId, enabled, handleInsert]);

  // Return channel status for debugging
  return {
    isConnected: channelRef.current?.state === 'joined',
  };
}
