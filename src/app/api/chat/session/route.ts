import { NextRequest, NextResponse } from 'next/server';
import { createChatSession } from '@/lib/chat-actions';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title } = body;
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const id = await createChatSession(userId, title || 'Untitled Chat');
    if (!id) {
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (err) {
    console.error('Error in /api/chat/session:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
