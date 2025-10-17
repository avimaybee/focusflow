import { NextRequest, NextResponse } from 'next/server';
import { addChatMessage } from '@/lib/chat-actions';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/chat/message');
  try {
    const raw = await request.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { console.warn('[API] message route could not parse JSON body', raw); }
    console.log('[API] message body keys:', parsed ? Object.keys(parsed) : null);
    const { sessionId, role, content, accessToken } = parsed || {};
    if (!sessionId || !role || typeof content !== 'string') {
      console.error('[API] Missing required fields in /api/chat/message', { sessionId, role, contentType: typeof content });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // accessToken is optional for backward compatibility, but recommended
    await addChatMessage(sessionId, role, content, accessToken);
    console.log('[API] message saved for sessionId=', sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/chat/message:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
