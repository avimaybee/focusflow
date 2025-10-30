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
  const { message, history, personaId, sessionId, userId, attachments, isGuest } = validatedInput;
  const requestId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  console.log(`[chat-flow][${requestId}] Incoming request`, {
    sessionId,
    userId,
    isGuest,
    personaId,
    hasClientHistory: !!history?.length,
    clientHistoryLength: history?.length ?? 0,
    attachmentCount: attachments?.length ?? 0,
    messagePreview: message.slice(0, 120),
  });

  // STEP 1: Save user message to database FIRST (so it's in the history when we fetch)
  if (sessionId && userId && !isGuest) {
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
      console.log(`[chat-flow][${requestId}] Saved user message`, {
        sessionId,
        attachmentCount: dbAttachments?.length ?? 0,
      });
    } catch (error) {
      console.error(`[chat-flow][${requestId}] Failed to save user message`, error);
      // Don't fail - continue with the request
    }
  }

  // STEP 2: Fetch persona from database
  const selectedPersona = personaId 
    ? await getPersonaById(personaId) 
    : await getDefaultPersona();
  
  const personaPrompt = selectedPersona?.prompt || 'You are a helpful AI assistant for students.';
  console.log(`[chat-flow][${requestId}] Persona loaded`, {
    personaId: selectedPersona?.id ?? 'default',
    personaName: selectedPersona?.name ?? 'Default',
    promptPreview: personaPrompt.slice(0, 120),
  });

  // STEP 3: Load full conversation history from database (if sessionId provided)
  // This ensures the AI sees ALL messages, including the one we just saved
  let conversationHistory = history || [];
  if (sessionId && !history) {
    console.log(`[chat-flow][${requestId}] Fetching conversation from database`, { sessionId });
    try {
      const dbMessages = await getChatMessages(sessionId);
      conversationHistory = dbMessages.map(msg => ({
        role: msg.role,
        text: msg.rawText || msg.text?.toString() || '',
      }));
      console.log(`[chat-flow][${requestId}] Loaded conversation`, {
        totalMessages: conversationHistory.length,
      });
      
      // Get conversation stats before truncation
      const stats = getConversationStats(conversationHistory);
      console.log(`[chat-flow][${requestId}] Conversation stats`, stats);
      
      // Truncate history to prevent context overflow (max 30k tokens, ~120k characters)
      const { truncated, droppedCount, estimatedTokens } = truncateConversation(conversationHistory, 30000);
      conversationHistory = truncated;
      
      if (droppedCount > 0) {
        console.log(`[chat-flow][${requestId}] Truncated history`, {
          droppedCount,
          estimatedTokens,
          remainingMessages: conversationHistory.length,
        });
      }
    } catch (error) {
      console.error(`[chat-flow][${requestId}] Failed to load conversation history`, error);
      conversationHistory = [];
    }
  } else if (history && history.length > 0) {
    // Also truncate if history was passed directly
    const { truncated, droppedCount } = truncateConversation(history, 30000);
    conversationHistory = truncated;
    
    if (droppedCount > 0) {
      console.log(`[chat-flow][${requestId}] Truncated provided history`, {
        droppedCount,
        remainingMessages: conversationHistory.length,
      });
    }
  }

  // STEP 4: Create stateful chat session with truncated history
  const chat = createChatSession({
    temperature: 0.7,
    maxOutputTokens: 8192,
    systemInstruction: personaPrompt,
    history: conversationHistory,
  });
  console.log(`[chat-flow][${requestId}] Chat session created`, {
    historyLength: conversationHistory.length,
    attachmentCount: attachments?.length ?? 0,
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
      console.log(`[chat-flow][${requestId}] Added attachments to message`, {
        attachmentCount: attachments.length,
      });
    }

    // STEP 5: Send message and get response
    const response = await chat.sendMessage({
      message: messageParts.length === 1 ? message : messageParts,
    });

    const generatedText = response.text || '';
    console.log(`[chat-flow][${requestId}] Generated response`, {
      responseLength: generatedText.length,
      responsePreview: generatedText.slice(0, 120),
    });

    // STEP 6: Save AI response to database
    if (sessionId && userId && !isGuest) {
      try {
        await addChatMessage(sessionId, 'model', generatedText);
        console.log(`[chat-flow][${requestId}] Saved AI response`, { sessionId });
      } catch (error) {
        console.error(`[chat-flow][${requestId}] Failed to save AI response`, error);
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
    console.error(`[chat-flow][${requestId}] Error during chat flow`, error);
    
    // Handle specific error types
    if (error?.message?.includes('overloaded') || error?.message?.includes('quota')) {
      console.error(`[chat-flow][${requestId}] Model overloaded or quota exceeded`);
      throw new Error('The AI service is currently overloaded. Please try again in a moment.');
    }
    
    if (error?.message?.includes('context') || error?.message?.includes('token')) {
      console.error(`[chat-flow][${requestId}] Context window exceeded`);
      throw new Error('The conversation has become too long. Please start a new chat.');
    }
    
    throw error;
  }
}
