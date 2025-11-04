const GEMINI_PROXY_PATH = '/api/chat/file';

/**
 * Build a local proxy URL for a Gemini file URI so the browser can download it without exposing the API key.
 */
export function buildGeminiProxyUrl(uri: string | null | undefined): string {
  if (!uri) {
    return '';
  }

  return `${GEMINI_PROXY_PATH}?uri=${encodeURIComponent(uri)}`;
}

/**
 * Determine whether a URL already goes through the Gemini proxy route.
 */
export function isGeminiProxyUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith(`${GEMINI_PROXY_PATH}?uri=`);
}
