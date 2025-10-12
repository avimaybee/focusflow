import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query: Record<string, string> = {};
    for (const [k, v] of url.searchParams) query[k] = v;

    // Collect small set of headers; avoid logging extremely large or sensitive values
    const headers: Record<string, string> = {};
    for (const [k, v] of request.headers) {
      headers[k] = v;
    }

    let rawBody = '';
    try {
      rawBody = await request.text();
    } catch (e) {
      rawBody = '[unreadable]';
    }

    let parsedBody: unknown = null;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch (e) {
      parsedBody = rawBody;
    }

    const result = {
      method: request.method,
      url: request.url,
      query,
      headers,
      body: parsedBody,
      timestamp: new Date().toISOString(),
    };

    console.log('[API DEBUG] request received', { method: request.method, url: request.url, queryKeys: Object.keys(query) });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API DEBUG] error handling request', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
