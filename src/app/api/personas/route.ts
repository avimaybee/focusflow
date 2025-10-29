import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PersonaRecord {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  const key = serviceRoleKey || anonKey;

  if (!key) {
    throw new Error('Missing Supabase key environment variable');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('personas')
      .select('id, name, display_name, description, prompt, avatar_url, avatar_emoji, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[api/personas] Supabase query failed', error);
      return NextResponse.json({ error: 'Failed to load personas' }, { status: 500 });
    }

  const personas = ((data as PersonaRecord[] | null) || []).map((persona) => ({
      id: persona.id,
      name: persona.name,
      displayName: persona.display_name,
      description: persona.description,
      prompt: persona.prompt,
      avatarUrl: persona.avatar_url,
      avatarEmoji: persona.avatar_emoji,
      sortOrder: persona.sort_order ?? 0,
    }));

    return NextResponse.json(
      { personas },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error) {
    console.error('[api/personas] Unexpected error', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
