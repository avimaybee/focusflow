// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "firebase-admin/auth";
import { app } from '@/lib/firebase-admin'; // Use the initialized admin app
import { chatFlow } from '@/ai/flows/chat-flow';
import { streamFlow } from 'genkit/next';

export const dynamic = 'force-dynamic';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.split('Bearer ')[1];

  if (!idToken) {
    console.log("No auth token found in request.");
    return null;
  }
  
  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
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

  const { message, sessionId, context, persona } = body;

  if (!message && !context) {
    return NextResponse.json(
      { error: 'Message or context is required' },
      { status: 400 }
    );
  }

  try {
    const stream = await streamFlow(chatFlow, {
      userId,
      message,
      sessionId,
      persona,
      context,
    });
    
    return new NextResponse(stream.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-Id': stream.headers['X-Session-Id'],
      },
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
