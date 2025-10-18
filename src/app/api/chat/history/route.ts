import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabaseCredentials() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Supabase] Missing environment variables!');
        throw new Error('Missing Supabase URL or Anon Key environment variables.');
    }

    return { supabaseUrl, supabaseAnonKey };
}

/**
 * GET /api/chat/history - Retrieve user's chat history
 */
export async function GET(request: NextRequest) {
    console.log('[API] GET /api/chat/history');
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            console.error('[API] Missing userId in /api/chat/history');
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            console.error('[API] Missing authorization header in /api/chat/history');
            return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
        }

        const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
        
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        });

        const { data, error } = await supabaseClient
            .from('chat_sessions')
            .select('id, title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching chat history:', error);
            return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
        }

        if (!data) {
            console.warn('[API] No data returned for userId:', userId);
            return NextResponse.json([]);
        }

        const history = data.map(item => ({
            id: item.id,
            title: item.title || 'Untitled Chat',
            createdAt: item.created_at,
        }));

        console.log('[API] Successfully fetched', history.length, 'chat sessions for user:', userId);
        return NextResponse.json(history);
    } catch (err) {
        console.error('[API] Error in /api/chat/history:', err);
        return NextResponse.json({ 
            error: 'Internal error', 
            details: err instanceof Error ? err.message : String(err) 
        }, { status: 500 });
    }
}
