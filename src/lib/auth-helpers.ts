import { createClient } from '@supabase/supabase-js';
import { supabase as clientSupabase } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables.');
}

/**
 * Get the authenticated user from a request in Edge runtime.
 * This function extracts the authorization header and uses it to verify the user session.
 */
export async function getUserFromRequest(request: Request): Promise<{
  userId: string | null;
  isAnonymous: boolean;
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { userId: null, isAnonymous: true };
    }

    // Create a Supabase client with the auth header
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get the user from the session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.warn('[Auth] Failed to get user from request:', error?.message);
      return { userId: null, isAnonymous: true };
    }

    return { userId: user.id, isAnonymous: false };
  } catch (error) {
    console.error('[Auth] Error getting user from request:', error);
    return { userId: null, isAnonymous: true };
  }
}

/**
 * Get auth headers to include in API requests from the client.
 * This ensures the user's session is properly authenticated on the server.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await clientSupabase.auth.getSession();
    
    if (!session?.access_token) {
      return { 'Content-Type': 'application/json' };
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  } catch (error) {
    console.error('[Auth] Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
}

/**
 * Make an authenticated fetch request.
 * Automatically includes auth headers from the current session.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
}
