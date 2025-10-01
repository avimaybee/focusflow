// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';

// This helper function is now a placeholder.
// It will be replaced with Supabase auth later.
async function getUserFromRequest(req: NextRequest): Promise<{ uid: string | null; isAnonymous: boolean }> {
    // For now, we'll assume all users are guests.
    return { uid: 'guest-user', isAnonymous: true };
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