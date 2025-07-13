// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.warn("API ROUTE: Missing Authorization header.");
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        console.warn("API ROUTE: Bearer token not found in Authorization header.");
        return null;
    }
    
    try {
        const decodedToken = await getAuth(app).verifyIdToken(idToken);
        console.log(`API ROUTE: Successfully authenticated user: ${decodedToken.uid}`);
        return decodedToken.uid;
    } catch (error) {
        console.error('API ROUTE: Error verifying auth token:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE: POST /api/chat ===');
  
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing authentication token.' }, { status: 401 });
    }

    const body = await request.json();
    console.log('DEBUG: Request body:', JSON.stringify(body, null, 2));

    if (!body.message) {
      console.error('ERROR: Missing required field: message');
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    // The userId for the flow now comes from the secure token, not the client body
    const input = {
      userId: userId,
      message: body.message,
      sessionId: body.sessionId,
      persona: body.persona || 'neutral',
      context: body.context,
    };

    console.log('DEBUG: Calling chatFlow with input:', JSON.stringify(input, null, 2));

    // The expert-provided code is non-streaming. We must pass an empty callback.
    const result = await chatFlow(input, () => {});
    
    console.log('DEBUG: ChatFlow completed successfully');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('=== FATAL API ROUTE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorMessage = error.message || 'An internal server error occurred.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
