// src/app/api/chat/route.ts (or wherever your API route is)
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

// This is a temporary helper function to get the user ID until you
// decide on a final authentication strategy for this route.
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.split('Bearer ')[1];

    if (!idToken) {
        console.log("API ROUTE DEBUG: No auth token found in request.");
        return null;
    }
    
    try {
        const decodedToken = await getAuth(app).verifyIdToken(idToken);
        console.log(`API ROUTE DEBUG: Successfully authenticated user: ${decodedToken.uid}`);
        return decodedToken.uid;
    } catch (error) {
        console.error('API ROUTE DEBUG: Error verifying auth token:', error);
        return null;
    }
}


export async function POST(request: NextRequest) {
  console.log('=== API ROUTE: POST /api/chat ===');
  
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    console.log('DEBUG: Parsing request body...');
    const body = await request.json();
    console.log('DEBUG: Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.message) {
      console.error('ERROR: Missing required field: message');
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Prepare input for chatFlow
    const input = {
      userId: userId, // Use authenticated user ID
      message: body.message,
      sessionId: body.sessionId,
      persona: body.persona || 'neutral',
      context: body.context,
    };

    console.log('DEBUG: Calling chatFlow with input:', JSON.stringify(input, null, 2));

    // This is now a non-streaming call, as per the expert's debugging code.
    // Note: The client-side will need to be adjusted to handle this.
    const result = await chatFlow(input, () => {}); // Pass an empty streaming callback
    
    console.log('DEBUG: ChatFlow completed successfully');
    console.log('DEBUG: Result structure:', {
      sessionId: result.sessionId,
      responseLength: result.response?.length || 0
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('=== API ROUTE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Log additional properties
    if (error?.code) {
      console.error('Error code:', error.code);
    }
    if (error?.status) {
      console.error('Error status:', error.status);
    }
    if (error?.details) {
      console.error('Error details:', error.details);
    }
    
    // Check for specific error types
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error?.message) {
      errorMessage = error.message;
    }
    
    if (error?.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = `Validation error: ${error.message}`;
    }
    
    if (error?.message?.includes('quota')) {
      statusCode = 429;
      errorMessage = 'API quota exceeded. Please try again later.';
    }
    
    if (error?.message?.includes('authentication')) {
      statusCode = 401;
      errorMessage = 'Authentication failed. Please check your API keys.';
    }
    
    if (error?.message?.includes('PERMISSION_DENIED')) {
      statusCode = 403;
      errorMessage = 'Permission denied. Please check your Firebase configuration.';
    }
    
    console.error('=== END API ROUTE ERROR ===');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: statusCode }
    );
  }
}
