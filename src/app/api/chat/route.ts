
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

// This is a server-side helper function to get the user's ID from the request headers.
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        // This is a guest user if there's no auth header.
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

    // If there's no userId, it's a guest request.
    // In a production app, you might add rate-limiting here.
    const isGuest = !userId;

    const body = await request.json();
    console.log("[DEBUG: API Route] Received request body:", JSON.stringify(body, null, 2));

    if (!body.message) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    // This is the input that will be passed to our main AI flow.
    const input = {
      // Use a placeholder for guest users or the actual user ID.
      userId: userId || 'guest-user',
      message: body.message,
      sessionId: isGuest ? undefined : body.sessionId,
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
