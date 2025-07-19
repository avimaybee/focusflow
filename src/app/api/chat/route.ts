
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

// This helper function now returns the user's ID and their authentication status (full user or anonymous).
async function getUserFromRequest(req: NextRequest): Promise<{ uid: string | null; isAnonymous: boolean }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return { uid: null, isAnonymous: true };
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        console.error('API ROUTE ERROR: Bearer token not found in Authorization header.');
        return { uid: null, isAnonymous: true };
    }
    
    try {
        const decodedToken = await getAuth(app).verifyIdToken(idToken);
        const isAnonymous = decodedToken.firebase.sign_in_provider === 'anonymous';
        return { uid: decodedToken.uid, isAnonymous };
    } catch (error) {
        console.error('API ROUTE ERROR: Error verifying auth token:', error);
        return { uid: null, isAnonymous: true };
    }
}

export async function POST(request: NextRequest) {
  console.log('=== NEW CHAT REQUEST ===');
  try {
    const { uid, isAnonymous } = await getUserFromRequest(request);
    console.log(`[DEBUG] Authenticated User ID: ${uid || 'Guest'}, Is Anonymous: ${isAnonymous}`);

    const body = await request.json();
    console.log("[DEBUG] Request Body:", JSON.stringify(body, null, 2));

    if (!body.message) {
      console.error("[ERROR] Missing required field: message");
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    const input = {
      userId: uid || 'guest-user',
      isGuest: isAnonymous, // Pass the guest status to the flow
      message: body.message,
      sessionId: body.sessionId,
      personaId: body.personaId || 'neutral',
      context: body.context,
    };

    console.log("[DEBUG] Calling chatFlow with input:", input);
    
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
    
    try {
      const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
        headers: { 'Metadata-Flavor': 'Google' },
      });
      if (response.ok) {
        const email = await response.text();
        console.error(`[DEBUG] Running as service account: ${email}`);
      }
    } catch (metaError) {
      console.error('[DEBUG] Could not fetch service account metadata.');
    }

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
