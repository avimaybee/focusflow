// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { ai } from '@/ai/flows/chat-flow';
import { defaultPersonas } from '@/lib/personas';

// Set the runtime to Node.js, as required by Genkit's dependencies.
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { sessionId, message, personaId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const selectedPersona = defaultPersonas.find(p => p.id === personaId);
    const personaPrompt = selectedPersona?.prompt || defaultPersonas.find(p => p.id === 'neutral')!.prompt;

    const chat = ai.chat({
      sessionId,
      system: personaPrompt,
      model: 'gemini-2.0-flash-lite',
    });

    const response = await chat.send(message);
    const text = response.text();

    return NextResponse.json({
      sessionId: chat.sessionId,
      response: text,
    });
  } catch (error: any) {
    console.error('=== CHAT API ERROR ===', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.', details: error.message },
      { status: 500 }
    );
  }
}