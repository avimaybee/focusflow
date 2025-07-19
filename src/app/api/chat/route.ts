
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
  console.log('=== NEW CHAT REQUEST ===');
  try {
    const userId = await getUserIdFromRequest(request);
    console.log(`[DEBUG] Authenticated User ID: ${userId || 'Guest'}`);

    // If there's no userId, it's a guest request.
    // In a production app, you might add rate-limiting here.
    const isGuest = !userId;

    const body = await request.json();
    console.log("[DEBUG] Request Body:", JSON.stringify(body, null, 2));

    if (!body.message) {
      console.error("[ERROR] Missing required field: message");
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    // This is the input that will be passed to our main AI flow.
    const input = {
      // Use a placeholder for guest users or the actual user ID.
      userId: userId || 'guest-user',
      message: body.message,
      sessionId: isGuest ? undefined : body.sessionId,
      personaId: body.personaId || 'neutral',
      context: body.context, // This can be a data URI for a file
    };

    console.log("[DEBUG] Calling chatFlow with input:", input);
    
    // We call the main chat flow and await its result.
    const result = await chatFlow(input);

    console.log("[DEBUG] Received result from flow:", result);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('=== FATAL API ROUTE ERROR ===');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Details:', error.details);
    console.error('Error Stack:', error.stack);
    
    // Attempt to get the service account email if running in a Google Cloud environment
    try {
      const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
        headers: { 'Metadata-Flavor': 'Google' },
      });
      if (response.ok) {
        const email = await response.text();
        console.error(`[DEBUG] Running as service account: ${email}`);
      }
    } catch (metaError) {
      console.error('[DEBUG] Could not fetch service account metadata. Not in a standard GCP environment or metadata server is blocked.');
    }

    // Provide the specific error message in the response for debugging
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
