import { NextRequest, NextResponse } from 'next/server';
import { addChatMessage } from '@/lib/chat-actions-edge';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/chat/message');
  try {
    const raw = await request.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { console.warn('[API] message route could not parse JSON body', raw); }
    console.log('[API] message body keys:', parsed ? Object.keys(parsed) : null);
    const { sessionId, role, content, accessToken } = parsed || {};
    if (!sessionId || !role || typeof content !== 'string') {
      console.error('[API] Missing required fields in /api/chat/message', { sessionId, role, contentType: typeof content });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prefer Authorization header, fallback to accessToken in body
    const authHeader = request.headers.get('authorization');
    const token = authHeader || (accessToken ? `Bearer ${accessToken}` : undefined);

    const success = await addChatMessage(sessionId, role, content, token || undefined);
    if (!success) {
      console.error('[API] Failed to save message for sessionId=', sessionId);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    console.log('[API] message saved for sessionId=', sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/chat/message:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
