import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables.');
}

// Client-side Supabase client (for use in browser context)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create an authenticated Supabase client using a user's access token.
 * This is essential for server-side operations (Edge functions) to bypass RLS policies.
 * 
 * @param accessToken - The user's JWT access token from their session
 * @returns Authenticated Supabase client
 */
export function createAuthenticatedSupabaseClient(token: string): SupabaseClient {
  const authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}
