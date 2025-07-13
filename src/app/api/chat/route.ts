// src/app/api/chat/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {ai} from '@/ai/genkit';
import {
  Message,
  defineTool,
  genkitToolAuth,
  getHistory,
  userFacing,
} from 'genkit/beta';
import {z} from 'zod';
import {
  createDiscussionPromptsTool,
  createFlashcardsTool,
  createMemoryAidTool,
  createQuizTool,
  createStudyPlanTool,
  explainConceptTool,
  highlightKeyInsightsTool,
  summarizeNotesTool,
} from '@/ai/tools';
import {FirestoreSessionStore} from '@/lib/firestore-session-store';
import {auth} from 'firebase-admin';

export const dynamic = 'force-dynamic';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!authToken) {
    return null;
  }
  try {
    const decodedToken = await auth().verifyIdToken(authToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  const {message, sessionId: chatSessionId, context, persona} = await req.json();

  if (!message) {
    return NextResponse.json({error: 'Message is required'}, {status: 400});
  }

  try {
    const store = new FirestoreSessionStore();
    const sessionId = `${userId}_${chatSessionId || crypto.randomUUID()}`;

    // Use ai.chat for stateful, persistent conversations
    const chat = await ai.chat({
      tools: [
        summarizeNotesTool,
        createStudyPlanTool,
        createFlashcardsTool,
        createQuizTool,
        explainConceptTool,
        createMemoryAidTool,
        createDiscussionPromptsTool,
        highlightKeyInsightsTool,
      ],
      system: `You are an expert AI assistant. Your persona is ${persona}.`,
      sessionId: sessionId,
      store: store,
    });

    const userMessageContent: MessageData[] = [{text: message}];
    if (context) {
      userMessageContent.unshift({text: `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n`});
    }

    const {stream, response} = ai.generateStream({
      model: 'googleai/gemini-1.5-flash',
      history: await getHistory(chat),
      prompt: userMessageContent,
    });

    // Save the user's message to history immediately
    const fullHistory = await getHistory(chat);
    fullHistory.push({role: 'user', content: userMessageContent});
    await chat.saveHistory(fullHistory);


    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        for await (const chunk of stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(textEncoder.encode(text));
          }
        }
        
        // After streaming is complete, save the model's response to history
        fullHistory.push({role: 'model', content: [{text: fullResponse}]});
        await chat.saveHistory(fullHistory);

        controller.close();
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-Id': sessionId, // Send back the session ID
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage =
      error instanceof userFacing.UserFacingError
        ? error.message
        : 'An unexpected error occurred.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}
