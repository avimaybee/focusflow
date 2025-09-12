// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { runFlow } from 'genkit/beta';
import { chatFlow } from '@/ai/flows/chat-flow';

// Set the runtime to Node.js, as required by Genkit's dependencies.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // The Zod schema in the Genkit flow will handle validation.
    const result = await runFlow(chatFlow, body);

    return NextResponse.json(result);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('=== CHAT API ERROR ===', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.', details: error.message },
      { status: 500 }
    );
  }
}