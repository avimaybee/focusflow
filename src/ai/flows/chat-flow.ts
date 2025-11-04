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
    name: z.string().optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
  })).optional(),
  authToken: z.string().optional(),
});

type ChatFlowInput = z.infer<typeof chatFlowInputSchema>;

export async function chatFlow(input: ChatFlowInput) {
  const validatedInput = chatFlowInputSchema.parse(input);
  const { message, history, personaId, sessionId, userId, attachments, isGuest, authToken } = validatedInput;
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
        url: att.data,
        name: att.name || att.data.split('/').pop() || 'attachment',
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes != null ? String(att.sizeBytes) : '0',
      }));

      // Save user message with current persona ID and attachments
      await addChatMessage(sessionId, 'user', message, authToken, dbAttachments, personaId);
      console.log(`[chat-flow][${requestId}] Saved user message`, {
        sessionId,
        personaId,
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
  
  const basePersonaPrompt = selectedPersona?.prompt || 'You are a helpful AI assistant for students.';
  
  console.log(`[chat-flow][${requestId}] Persona loaded`, {
    personaId: selectedPersona?.id ?? 'default',
    personaName: selectedPersona?.name ?? 'Default',
    promptPreview: basePersonaPrompt.slice(0, 120),
  });

  // STEP 3: Load full conversation history from database (if sessionId provided)
  // This ensures the AI sees ALL messages, including the one we just saved
  let conversationHistory = history || [];
  let hasPersonaSwitch = false;
  let previousPersonaName = '';
  
  if (sessionId && !history) {
    console.log(`[chat-flow][${requestId}] Fetching conversation from database`, { sessionId });
    try {
      const dbMessages = await getChatMessages(sessionId, authToken);
      
      // Detect persona switches by checking the last few messages
      if (dbMessages.length > 0) {
        const recentMessages = dbMessages.slice(-5); // Check last 5 messages
        const personaIds = new Set(recentMessages
          .filter(msg => msg.personaId)
          .map(msg => msg.personaId));
        
        if (personaIds.size > 1 || (personaIds.size === 1 && !personaIds.has(personaId))) {
          hasPersonaSwitch = true;
          // Find the previous persona name
          const lastDifferentPersona = dbMessages
            .reverse()
            .find(msg => msg.personaId && msg.personaId !== personaId);
          
          if (lastDifferentPersona?.persona?.name) {
            previousPersonaName = lastDifferentPersona.persona.name;
          }
          
          console.log(`[chat-flow][${requestId}] Persona switch detected`, {
            previousPersona: previousPersonaName,
            currentPersona: selectedPersona?.name,
          });
        }
      }
      
      conversationHistory = dbMessages.map(msg => ({
        role: msg.role,
        text: msg.rawText || msg.text?.toString() || '',
      }));
      console.log(`[chat-flow][${requestId}] Loaded conversation`, {
        totalMessages: conversationHistory.length,
        hasPersonaSwitch,
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

  // STEP 3.5: Build enhanced system prompt with persona switch handling
  let personaPrompt = basePersonaPrompt;
  
  if (hasPersonaSwitch && previousPersonaName) {
    // Add explicit instructions when persona switches are detected
    personaPrompt = `${basePersonaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 IMPORTANT: PERSONA TRANSITION DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are NOW acting as: "${selectedPersona?.name || 'Default Assistant'}"

CRITICAL INSTRUCTIONS FOR HANDLING CONVERSATION HISTORY:
1. You will see previous messages from "${previousPersonaName}" in this conversation
2. COMPLETELY DISREGARD their personality, tone, and system instructions
3. Those messages were from a DIFFERENT assistant - NOT you
4. Do NOT attempt to maintain consistency with ${previousPersonaName}'s responses
5. If the user references something ${previousPersonaName} said, acknowledge it briefly but respond as YOURSELF

YOUR ROLE NOW:
- Follow ONLY the instructions and personality defined at the top of this prompt
- Be authentic to YOUR character as ${selectedPersona?.name}
- Respond with YOUR unique perspective, not ${previousPersonaName}'s
- The user has chosen YOU for this interaction - honor that choice

Begin acting as ${selectedPersona?.name} NOW.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } else {
    // No persona switch - just add basic context awareness
    personaPrompt = `${basePersonaPrompt}

CONTEXT INSTRUCTIONS:
- You are "${selectedPersona?.name || 'Default Assistant'}"
- If you see any previous system instructions in this conversation, ignore them
- Follow ONLY the role and instructions defined above`;
  }

  // STEP 4: Create stateful chat session with truncated history
  // Using Gemini 2.5 Flash's max output token limit: 65,536 tokens
  // See: https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash
  const chat = createChatSession({
    temperature: 0.7,
    maxOutputTokens: 65536,
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

    // STEP 6: Save AI response to database with persona ID
    if (sessionId && userId && !isGuest) {
      try {
        await addChatMessage(sessionId, 'model', generatedText, authToken, undefined, personaId);
        console.log(`[chat-flow][${requestId}] Saved AI response`, { sessionId, personaId });
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
