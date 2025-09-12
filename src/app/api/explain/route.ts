import { NextResponse } from 'next/server';
import { getExplanation } from '@/lib/ai-actions';

export async function POST(request: Request) {
  try {
    const { concept } = await request.json();

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json({ error: 'Concept must be a non-empty string.' }, { status: 400 });
    }

    const explanationHtml = await getExplanation(concept);

    return NextResponse.json({ explanation: explanationHtml });
  } catch (error) {
    console.error('[API/EXPLAIN] Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
