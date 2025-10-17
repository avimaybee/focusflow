import { NextRequest, NextResponse } from 'next/server';
import { createChatSession } from '@/lib/chat-actions-edge';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/chat/session');
  try {
    const raw = await request.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { console.warn('[API] session route could not parse JSON body', raw); }
    console.log('[API] session body keys:', parsed ? Object.keys(parsed) : null);
    const { userId, title, accessToken } = parsed || {};
    
    if (!userId) {
      console.error('[API] Missing userId in /api/chat/session');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Prefer Authorization header, fallback to accessToken in body
    const authHeader = request.headers.get('authorization');
    const token = authHeader || (accessToken ? `Bearer ${accessToken}` : undefined);
    
    console.log('[API] Calling createChatSession with userId:', userId, 'title:', title, 'hasToken:', !!token);

    const id = await createChatSession(userId, title || 'Untitled Chat', token || undefined);
    if (!id) {
      console.error('[API] createChatSession returned null/undefined - this indicates a database or RLS policy error');
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    console.log('[API] Created session id=', id);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[API] Error in /api/chat/session:', err);
    // Return more detailed error message
    return NextResponse.json({ 
      error: 'Internal error', 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
