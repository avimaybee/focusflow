
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    console.log('API ROUTE: Verifying user auth...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.error('API ROUTE ERROR: No Authorization header found.');
        return null;
    }
    console.log('API ROUTE DEBUG: Authorization header found.');

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        console.error('API ROUTE ERROR: Bearer token not found in Authorization header.');
        return null;
    }
    console.log(`API ROUTE DEBUG: Extracted token: ${idToken.substring(0, 15)}...`);
    
    try {
        console.log('API ROUTE DEBUG: Calling getAuth(app).verifyIdToken...');
        const decodedToken = await getAuth(app).verifyIdToken(idToken);
        console.log(`API ROUTE DEBUG: Token verified successfully for UID: ${decodedToken.uid}`);
        return decodedToken.uid;
    } catch (error) {
        console.error('API ROUTE ERROR: Error verifying auth token:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('API ROUTE DEBUG: Received request body:', body);


    if (!body.message) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    const input = {
      userId: userId,
      message: body.message,
      sessionId: body.sessionId,
      persona: body.persona || 'neutral',
      context: body.context,
    };
    
    console.log('API ROUTE DEBUG: Calling chatFlow with input:', input);
    const result = await chatFlow(input);
    console.log('API ROUTE DEBUG: chatFlow completed successfully. Result:', result);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('=== FATAL API ROUTE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'An internal server error occurred.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
