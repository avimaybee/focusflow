import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GEMINI_API_HOST = 'generativelanguage.googleapis.com';

export async function GET(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  try {
    const { searchParams } = new URL(request.url);
    const rawUri = searchParams.get('uri');

    if (!rawUri) {
      return NextResponse.json({ error: 'Missing file URI' }, { status: 400 });
    }

    let remoteUrl: URL;
    try {
      remoteUrl = new URL(rawUri);
    } catch {
      return NextResponse.json({ error: 'Invalid file URI' }, { status: 400 });
    }

    if (remoteUrl.hostname !== GEMINI_API_HOST) {
      console.warn(`[chat-file-proxy][${requestId}] Blocked request to unsupported host`, {
        host: remoteUrl.hostname,
      });
      return NextResponse.json({ error: 'Unsupported file host' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`[chat-file-proxy][${requestId}] Missing GEMINI_API_KEY`);
      return NextResponse.json({ error: 'File proxy not configured' }, { status: 500 });
    }

    // Ensure the download request uses the correct query parameters
    const downloadUrl = new URL(remoteUrl.toString());
    downloadUrl.searchParams.set('alt', downloadUrl.searchParams.get('alt') ?? 'media');
    downloadUrl.searchParams.set('key', apiKey);

    console.log(`[chat-file-proxy][${requestId}] Proxying download`, {
      path: downloadUrl.pathname,
    });

    const geminiResponse = await fetch(downloadUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
      cache: 'no-store',
    });

    if (!geminiResponse.ok || !geminiResponse.body) {
      const status = geminiResponse.status;
      const bodyText = await geminiResponse.text().catch(() => '');
      console.error(`[chat-file-proxy][${requestId}] Gemini download failed`, {
        status,
        bodyPreview: bodyText.slice(0, 200),
      });
      return NextResponse.json({ error: 'Failed to fetch file from Gemini' }, { status });
    }

    const headers = new Headers();
    const contentType = geminiResponse.headers.get('content-type');
    const contentDisposition = geminiResponse.headers.get('content-disposition');
    const contentLength = geminiResponse.headers.get('content-length');

    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (contentLength) headers.set('Content-Length', contentLength);

    headers.set('Cache-Control', 'private, max-age=300');

    return new NextResponse(geminiResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(`[chat-file-proxy][${requestId}] Unexpected error`, error);
    return NextResponse.json({ error: 'Unable to proxy file download' }, { status: 500 });
  }
}
