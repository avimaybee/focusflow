export const runtime = 'experimental-edge';

/**
 * Simple middleware to proxy POSTs sent to /chat (page) to /api/chat
 * This avoids 405s when client code posts to the page path instead of /api.
 */
export async function middleware(req: Request) {
  try {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/chat') {
      const body = await req.text();
      const apiUrl = new URL('/api/chat', req.url).toString();
      console.debug('[middleware] proxy POST /chat ->', apiUrl);
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body || undefined,
      });
      const text = await resp.text();
      return new Response(text, { status: resp.status, headers: resp.headers });
    }
    return;
  } catch (err) {
    console.error('[middleware] error proxying /chat POST', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
