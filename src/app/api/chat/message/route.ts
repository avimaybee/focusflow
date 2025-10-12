import { NextRequest, NextResponse } from 'next/server';
import { addChatMessage } from '@/lib/chat-actions';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, role, content } = body;
    if (!sessionId || !role || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await addChatMessage(sessionId, role, content);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/chat/message:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
