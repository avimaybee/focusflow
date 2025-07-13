
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "firebase-admin/auth";
import { app } from '@/lib/firebase-admin';
import { chatFlow } from '@/ai/flows/chat-flow';
import { streamFlow } from 'genkit/beta';

export const dynamic = 'force-dynamic';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.split('Bearer ')[1];

  if (!idToken) {
    console.log("DEBUG: No auth token found in request.");
    return null;
  }
  
  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    console.log(`DEBUG: Successfully authenticated user: ${decodedToken.uid}`);
    return decodedToken.uid;
  } catch (error) {
    console.error('DEBUG: Error verifying auth token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log('\n--- DEBUG: /api/chat POST request received ---');
  let userId;
  try {
    userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }

  const body = await req.json();
  console.log('DEBUG: Request body parsed:', body);

  const { message, sessionId, context, persona } = body;

  if (!message && !context) {
    return NextResponse.json(
      { error: 'Message or context is required' },
      { status: 400 }
    );
  }

  try {
    console.log('DEBUG: Calling streamFlow with chatFlow...');
    const { stream, getFlowResult } = await streamFlow(chatFlow, {
      userId,
      message,
      sessionId,
      persona,
      context,
    });
    console.log('DEBUG: streamFlow call succeeded. Waiting for result...');

    const result = await getFlowResult();
    console.log('DEBUG: getFlowResult succeeded. Result:', result);

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-Id': result.sessionId,
      },
    });

  } catch (error: any) {
    console.error('--- FATAL ERROR in /api/chat ---');
    console.error('DEBUG: The error occurred within the main try/catch block.');
    console.error('DEBUG: Full error object:', error);
    console.error('---------------------------------');
    
    const errorMessage = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
