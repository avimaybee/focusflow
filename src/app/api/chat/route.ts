
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

// This is a server-side helper function to get the user's ID from the request headers.
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.error('API ROUTE ERROR: No Authorization header found.');
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        console.error('API ROUTE ERROR: Bearer token not found in Authorization header.');
        return null;
    }
    
    try {
        const decodedToken = await getAuth(app).verifyIdToken(idToken);
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
        console.error("API ROUTE: Unauthorized access detected.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log("API ROUTE: Received request body:", body);

    if (!body.message) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    // This is the input that will be passed to our main AI flow.
    const input = {
      userId: userId,
      message: body.message,
      sessionId: body.sessionId,
      persona: body.persona || 'neutral',
      context: body.context, // This can be a data URI for a file
    };

    console.log("API ROUTE: Calling chatFlow with input:", input);
    
    // We call the main chat flow and await its result.
    const result = await chatFlow(input);

    console.log("API ROUTE: Received result from flow:", result);
    
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
