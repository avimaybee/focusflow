// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { runFlow } from 'genkit/beta';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // The Zod schema in the Genkit flow will handle validation.
    const result = await runFlow(chatFlow, body);
    
    return NextResponse.json(result);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('=== FATAL API ROUTE ERROR ===');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    const errorMessage = error.cause?.message || error.message || 'No further details available.';

    return NextResponse.json(
      { 
        error: 'An internal server error occurred.',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}