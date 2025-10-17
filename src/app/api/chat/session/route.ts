import { NextRequest, NextResponse } from 'next/server';
import { createChatSession } from '@/lib/chat-actions';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/chat/session');
  try {
    const raw = await request.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { console.warn('[API] session route could not parse JSON body', raw); }
    console.log('[API] session body keys:', parsed ? Object.keys(parsed) : null);
    const { userId, title, accessToken } = parsed || {};
    
    if (!userId) {
      console.error('[API] Missing userId in /api/chat/session');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!accessToken) {
      console.error('[API] Missing accessToken in /api/chat/session - required for authenticated operations');
      return NextResponse.json({ error: 'Missing accessToken' }, { status: 401 });
    }

    const id = await createChatSession(userId, title || 'Untitled Chat', accessToken);
    if (!id) {
      console.error('[API] createChatSession returned null/undefined');
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    console.log('[API] Created session id=', id);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('Error in /api/chat/session:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
