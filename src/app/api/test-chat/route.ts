
import { NextRequest, NextResponse } from 'next/server';
import { simpleTestFlow } from '@/ai/flows/simple-test-flow';

/**
 * API route for the minimal test flow.
 */
export async function POST(request: NextRequest) {
  console.log('=== API ROUTE: POST /api/test-chat ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }
    
    const result = await simpleTestFlow({ message: body.message });
    
    console.log('Simple flow completed successfully. Result:', result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('=== API ROUTE /api/test-chat ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=======================================');
    
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
