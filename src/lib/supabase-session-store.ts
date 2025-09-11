import { SessionStore, SessionData } from 'genkit/beta';
import { supabase } from '@/lib/supabase';

// Define the structure of our session data in the database
interface SupabaseSessionRecord {
  session_id: string;
  session_data: SessionData<any>;
  updated_at: string;
}

export class SupabaseSessionStore<S = any> implements SessionStore<S> {
  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    console.log(`[SupabaseSessionStore] Getting session: ${sessionId}`);
    const { data, error } = await supabase
      .from('genkit_sessions')
      .select('session_data')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // "exact one row not found"
        console.log(`[SupabaseSessionStore] Session not found: ${sessionId}`);
        return undefined;
      }
      console.error(`[SupabaseSessionStore] Error getting session: ${sessionId}`, error);
      throw error;
    }

    console.log(`[SupabaseSessionStore] Session found: ${sessionId}`);
    return data?.session_data as SessionData<S>;
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    console.log(`[SupabaseSessionStore] Saving session: ${sessionId}`);
    const { error } = await supabase
      .from('genkit_sessions')
      .upsert({
        session_id: sessionId,
        session_data: sessionData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`[SupabaseSessionStore] Error saving session: ${sessionId}`, error);
      throw error;
    }
    console.log(`[SupabaseSessionStore] Session saved successfully: ${sessionId}`);
  }
}
