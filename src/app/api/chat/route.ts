// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatFlow } from '@/ai/flows/chat-flow';
import { getChatMessages } from '@/lib/chat-actions-edge';
import { getUserFromRequest } from '@/lib/auth-helpers';

// Ensure this API route runs on the Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const start = Date.now();
  console.log('[API] GET /api/chat hit', { url: request.url, method: request.method });
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
  const accessToken = url.searchParams.get('accessToken');
  console.log('[API] GET /api/chat sessionId=', sessionId, 'hasToken(query)=', !!accessToken);
    if (!sessionId) {
      console.log('[API] GET /api/chat no sessionId provided, returning empty array', { durationMs: Date.now() - start });
      return NextResponse.json([], { status: 200 });
    }
  // Prefer Authorization header, fallback to accessToken query param
  const authHeader = request.headers.get('authorization');
  const token = authHeader || (accessToken ? `Bearer ${accessToken}` : undefined);
  const messages = await getChatMessages(sessionId, token || undefined);
    console.log('[API] GET /api/chat returning messages count=', Array.isArray(messages) ? messages.length : typeof messages, { durationMs: Date.now() - start });
    return NextResponse.json(messages);
  } catch (err) {
    console.error('Error in GET /api/chat:', err);
    return NextResponse.json([], { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const start = Date.now();
  console.log('=== NEW CHAT REQUEST ===', { method: request.method, url: request.url });
  try {
    const { userId: uid, isAnonymous } = await getUserFromRequest(request);
    const authToken = request.headers.get('authorization');
    console.log('[API] Authenticated User ID:', uid || 'Guest', 'isAnonymous:', isAnonymous);

    // Log headers (avoid logging sensitive auth headers if present)
    try {
      const headers: Record<string, string> = {};
      for (const [k, v] of request.headers) {
        headers[k] = v;
      }
      console.log('[API] Request headers keys:', Object.keys(headers));
    } catch (herr) {
      console.warn('[API] Could not enumerate headers', herr);
    }

    const body = await request.text();
    interface ChatRequestBody {
      message?: string;
      sessionId?: string;
      personaId?: string;
      context?: unknown;
      attachments?: unknown;
    }

    let parsed: ChatRequestBody | null = null;
    try {
      parsed = body ? (JSON.parse(body) as ChatRequestBody) : null;
    } catch {
      console.warn('[API] Could not parse request body as JSON, raw body:', body);
    }
    console.log('[API] Request body (parsed):', parsed ? (Object.keys(parsed).length > 0 ? Object.fromEntries(Object.entries(parsed).slice(0, 20)) : parsed) : parsed);

    type RawAttachment = {
      type?: unknown;
      data?: unknown;
      uri?: unknown;
      mimeType?: unknown;
      contentType?: unknown;
      name?: unknown;
      sizeBytes?: unknown;
      size?: unknown;
    };

    const rawAttachments = Array.isArray(parsed?.attachments)
      ? (parsed.attachments as RawAttachment[])
      : undefined;

    type NormalizedAttachment = {
      type: 'file_uri' | 'inline_data';
      data: string;
      mimeType: string;
      name?: string;
      sizeBytes?: number;
    };

    const normalizedAttachments = rawAttachments
      ? rawAttachments.reduce<NormalizedAttachment[]>((acc, att) => {
          if (!att || typeof att !== 'object') {
            return acc;
          }

          const type: NormalizedAttachment['type'] = att.type === 'inline_data' ? 'inline_data' : 'file_uri';
          const data = typeof att.data === 'string'
            ? att.data
            : typeof att.uri === 'string'
              ? att.uri
              : null;
          const mimeType = typeof att.mimeType === 'string'
            ? att.mimeType
            : typeof att.contentType === 'string'
              ? att.contentType
              : null;

          if (!data || !mimeType) {
            return acc;
          }

          const name = typeof att.name === 'string' ? att.name : undefined;
          let sizeBytes: number | undefined;
          if (typeof att.sizeBytes === 'number') {
            sizeBytes = Math.max(0, att.sizeBytes);
          } else if (typeof att.size === 'number') {
            sizeBytes = Math.max(0, att.size);
          } else if (typeof att.sizeBytes === 'string') {
            const parsedSize = Number.parseInt(att.sizeBytes, 10);
            if (!Number.isNaN(parsedSize)) {
              sizeBytes = Math.max(0, parsedSize);
            }
          }

          acc.push({ type, data, mimeType, name, sizeBytes });
          return acc;
        }, [])
      : undefined;

    if (!parsed || !parsed.message) {
      console.error('[API] Missing required field: message');
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    const input = {
      userId: uid || 'guest-user',
      isGuest: isAnonymous,
      message: parsed.message,
      sessionId: parsed.sessionId,
      personaId: parsed.personaId || 'neutral',
      context: parsed.context,
      authToken: authToken || undefined,
      attachments: normalizedAttachments && normalizedAttachments.length > 0 ? normalizedAttachments : undefined,
    };

    console.log('[API] Calling chatFlow with input keys:', Object.keys(input));
    const result = await chatFlow(input);

    console.log('[API] chatFlow result keys:', result ? Object.keys(result).slice(0, 20) : result, { durationMs: Date.now() - start });
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('=== FATAL API ROUTE ERROR ===', error);
    const stack = error instanceof Error ? error.stack : undefined;
    if (stack) {
      console.error('Error stack:', stack);
    }
    const cause = error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : undefined;
    const message = error instanceof Error ? error.message : undefined;
    const errorMessage = cause || message || 'No further details available.';
    return NextResponse.json({ error: 'An internal server error occurred.', details: errorMessage }, { status: 500 });
  }
}

