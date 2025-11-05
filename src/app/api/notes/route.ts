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
 * GET /api/notes - Retrieve user's notes
 */
export async function GET(request: NextRequest) {
    console.log('[API] GET /api/notes');
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            console.error('[API] Missing userId in /api/notes GET');
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            console.error('[API] Missing authorization header in /api/notes GET');
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
            .from('user_notes')
            .select('content')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            // If no notes exist yet, return empty string
            if (error.code === 'PGRST116') {
                console.log('[API] No notes found for user:', userId);
                return NextResponse.json({ content: '' });
            }
            console.error('[API] Error fetching notes:', error);
            return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
        }

        console.log('[API] Successfully fetched notes for user:', userId);
        return NextResponse.json({ content: data?.content || '' });
    } catch (err) {
        console.error('[API] Error in /api/notes GET:', err);
        return NextResponse.json({ 
            error: 'Internal error', 
            details: err instanceof Error ? err.message : String(err) 
        }, { status: 500 });
    }
}

/**
 * POST /api/notes - Save or append to user's notes
 */
export async function POST(request: NextRequest) {
    console.log('[API] POST /api/notes');
    try {
        const raw = await request.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any = null;
        try { 
            parsed = raw ? JSON.parse(raw) : null; 
        } catch { 
            console.warn('[API] notes route could not parse JSON body', raw); 
        }
        
        const { userId, content, append, snippet } = parsed || {};
        
        // For append mode, we need userId and snippet
        // For save mode, we need userId and content
        if (!userId || (append ? typeof snippet !== 'string' : typeof content !== 'string')) {
            console.error('[API] Missing required fields in /api/notes POST', { 
                userId, 
                append, 
                hasContent: typeof content === 'string',
                hasSnippet: typeof snippet === 'string'
            });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            console.error('[API] Missing authorization header in /api/notes POST');
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

        if (append) {
            // Append mode: fetch existing notes and append snippet
            const { data: existing, error: fetchError } = await supabaseClient
                .from('user_notes')
                .select('content')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('[API] Error fetching notes for append:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch existing notes' }, { status: 500 });
            }

            // Add visual separator and spacing when appending
            const separator = '<hr class="my-4 border-t-2 border-gray-300" />';
            const newContent = existing?.content 
                ? existing.content + separator + snippet
                : snippet;

            if (existing) {
                // Update existing notes
                const { error: updateError } = await supabaseClient
                    .from('user_notes')
                    .update({ content: newContent })
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('[API] Error updating notes:', updateError);
                    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
                }
            } else {
                // Create new notes entry
                const { error: insertError } = await supabaseClient
                    .from('user_notes')
                    .insert({ user_id: userId, content: newContent });

                if (insertError) {
                    console.error('[API] Error creating notes:', insertError);
                    return NextResponse.json({ error: 'Failed to create notes' }, { status: 500 });
                }
            }

            console.log('[API] Successfully appended to notes for user:', userId);
            return NextResponse.json({ ok: true });
        } else {
            // Save mode: replace entire content
            const { data: existing, error: fetchError } = await supabaseClient
                .from('user_notes')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('[API] Error checking existing notes:', fetchError);
                return NextResponse.json({ error: 'Failed to check existing notes' }, { status: 500 });
            }

            if (existing) {
                // Update existing notes
                const { error: updateError } = await supabaseClient
                    .from('user_notes')
                    .update({ content })
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('[API] Error updating notes:', updateError);
                    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
                }
            } else {
                // Create new notes entry
                const { error: insertError } = await supabaseClient
                    .from('user_notes')
                    .insert({ user_id: userId, content });

                if (insertError) {
                    console.error('[API] Error creating notes:', insertError);
                    return NextResponse.json({ error: 'Failed to create notes' }, { status: 500 });
                }
            }

            console.log('[API] Successfully saved notes for user:', userId);
            return NextResponse.json({ ok: true });
        }
    } catch (err) {
        console.error('[API] Error in /api/notes POST:', err);
        return NextResponse.json({ 
            error: 'Internal error', 
            details: err instanceof Error ? err.message : String(err) 
        }, { status: 500 });
    }
}
