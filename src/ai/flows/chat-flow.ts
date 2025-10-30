'use server';

import { z } from 'zod';
import { getPersonaById, getDefaultPersona } from '@/lib/persona-actions';
import { createChatSession, createFileDataPart, createInlineDataPart } from '@/lib/gemini-client';
import { getChatMessages, addChatMessage } from '@/lib/chat-actions';
import { truncateConversation, getConversationStats } from '@/lib/conversation-manager';

const chatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional(),
  userId: z.string(),
  isGuest: z.boolean(),
  sessionId: z.string().optional(),
  personaId: z.string().optional(),
  context: z.any().optional(),
  // Support for multimodal input
  attachments: z.array(z.object({
    type: z.enum(['file_uri', 'inline_data']),
    data: z.string(), // base64 for inline_data, URI for file_uri
    mimeType: z.string(),
  })).optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export async function chatFlow(input: ChatFlowInput) {
  const validatedInput = chatFlowInputSchema.parse(input);
  const { message, history, personaId, sessionId, userId, attachments } = validatedInput;

  console.log('[chat-flow] Processing message', {
    sessionId,
    hasHistory: !!history?.length,
    hasAttachments: !!attachments?.length,
    personaId,
  });

  // Fetch persona from database
  const selectedPersona = personaId 
    ? await getPersonaById(personaId) 
    : await getDefaultPersona();
  
  const personaPrompt = selectedPersona?.prompt || 'You are a helpful AI assistant for students.';

  // If we have a sessionId, try to fetch the full conversation history from database
  let conversationHistory = history || [];
  if (sessionId && !history) {
    console.log('[chat-flow] Loading conversation history from database for session:', sessionId);
    try {
      const dbMessages = await getChatMessages(sessionId);
      conversationHistory = dbMessages.map(msg => ({
        role: msg.role,
        text: msg.rawText || msg.text?.toString() || '',
      }));
      console.log('[chat-flow] Loaded', conversationHistory.length, 'messages from database');
      
      // Get conversation stats before truncation
      const stats = getConversationStats(conversationHistory);
      console.log('[chat-flow] Conversation stats:', stats);
      
      // Truncate history to prevent context overflow (max 30k tokens, ~120k characters)
      const { truncated, droppedCount, estimatedTokens } = truncateConversation(conversationHistory, 30000);
      conversationHistory = truncated;
      
      if (droppedCount > 0) {
        console.log(`[chat-flow] Truncated ${droppedCount} old messages to fit context window (${estimatedTokens} tokens)`);
      }
    } catch (error) {
      console.error('[chat-flow] Failed to load conversation history:', error);
      conversationHistory = [];
    }
  } else if (history && history.length > 0) {
    // Also truncate if history was passed directly
    const { truncated, droppedCount } = truncateConversation(history, 30000);
    conversationHistory = truncated;
    
    if (droppedCount > 0) {
      console.log(`[chat-flow] Truncated ${droppedCount} messages from provided history`);
    }
  }

  // Create stateful chat session with truncated history
  const chat = createChatSession({
    temperature: 0.7,
    maxOutputTokens: 8192,
    systemInstruction: personaPrompt,
    history: conversationHistory,
  });

  try {
    // Build message parts (text + attachments)
    const messageParts: any[] = [{ text: message }];

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.type === 'file_uri') {
          messageParts.push(createFileDataPart(attachment.data, attachment.mimeType));
        } else if (attachment.type === 'inline_data') {
          messageParts.push(createInlineDataPart(attachment.data, attachment.mimeType));
        }
      }
      console.log('[chat-flow] Added', attachments.length, 'attachments to message');
    }

    // Send message and get response
    const response = await chat.sendMessage({
      message: messageParts.length === 1 ? message : messageParts,
    });

    const generatedText = response.text || '';
    console.log('[chat-flow] Generated response length:', generatedText.length);

    // Save messages to database if we have a session
    if (sessionId && userId && !validatedInput.isGuest) {
      try {
        // Convert attachments to database format
        const dbAttachments = attachments?.map(att => ({
          url: att.data, // URI or inline data
          name: att.data.split('/').pop() || 'attachment',
          mimeType: att.mimeType,
          sizeBytes: '0', // Would need to be passed from client
        }));

        // Save user message with attachments
        await addChatMessage(sessionId, 'user', message, undefined, dbAttachments);
        // Save AI response
        await addChatMessage(sessionId, 'model', generatedText);
        console.log('[chat-flow] Saved messages to database');
      } catch (error) {
        console.error('[chat-flow] Failed to save messages:', error);
        // Don't fail the whole request if saving fails
      }
    }

    return {
      sessionId: sessionId || 'new-session',
      response: generatedText,
      rawResponse: generatedText,
      persona: selectedPersona || await getDefaultPersona(),
    };
  } catch (error: any) {
    console.error('[chat-flow] Error:', error);
    
    // Handle specific error types
    if (error?.message?.includes('overloaded') || error?.message?.includes('quota')) {
      console.error('[chat-flow] Model overloaded or quota exceeded');
      throw new Error('The AI service is currently overloaded. Please try again in a moment.');
    }
    
    if (error?.message?.includes('context') || error?.message?.includes('token')) {
      console.error('[chat-flow] Context window exceeded');
      throw new Error('The conversation has become too long. Please start a new chat.');
    }
    
    throw error;
  }
}
