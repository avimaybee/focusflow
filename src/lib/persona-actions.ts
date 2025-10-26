'use server';

import { supabase } from '@/lib/supabase';

export interface Persona {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  personality_traits: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active personas from the database
 */
export async function getPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching personas:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a specific persona by ID
 */
export async function getPersonaById(id: string): Promise<Persona | null> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching persona ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Get the default persona (Gurt)
 */
export async function getDefaultPersona(): Promise<Persona | null> {
  return getPersonaById('gurt');
}

/**
 * Update a persona (admin function - can be restricted later)
 */
export async function updatePersona(
  id: string,
  updates: Partial<Persona>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('personas')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error(`Error updating persona ${id}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create a new persona (admin function)
 */
export async function createPersona(
  persona: Omit<Persona, 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('personas').insert(persona);

  if (error) {
    console.error('Error creating persona:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Toggle persona active status (soft delete)
 */
export async function togglePersonaActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updatePersona(id, { is_active: isActive });
}
