'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Retrieves the user's notes content from Supabase.
 * @param userId The ID of the user.
 * @returns The HTML content of the user's notes or an empty string.
 */
export async function getNotes(userId: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('user_notes')
      .select('content')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no notes exist yet, return empty string
      if (error.code === 'PGRST116') {
        return '';
      }
      console.error('Error fetching notes:', error);
      return '';
    }

    return data?.content || '';
  } catch (err) {
    console.error('Exception in getNotes:', err);
    return '';
  }
}

/**
 * Appends a snippet of text to the user's main notes document.
 * @param userId The ID of the user.
 * @param snippet The text snippet to append (can be plain text).
 */
export async function appendToNotes(userId: string, snippet: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, get existing notes
    const { data: existing, error: fetchError } = await supabase
      .from('user_notes')
      .select('content')
      .eq('user_id', userId)
      .single();

    let newContent = '';
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching notes for append:', fetchError);
      throw new Error('Failed to fetch existing notes');
    }

    if (existing) {
      // Append to existing notes
      newContent = existing.content + '\n\n' + snippet;
      
      const { error: updateError } = await supabase
        .from('user_notes')
        .update({ content: newContent })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating notes:', updateError);
        throw new Error('Failed to update notes');
      }
    } else {
      // Create new notes entry
      newContent = snippet;
      
      const { error: insertError } = await supabase
        .from('user_notes')
        .insert({ user_id: userId, content: newContent });

      if (insertError) {
        console.error('Error creating notes:', insertError);
        throw new Error('Failed to create notes');
      }
    }
  } catch (err) {
    console.error('Exception in appendToNotes:', err);
    throw err;
  }
}

/**
 * Saves the user's notes content to Supabase.
 * @param userId The ID of the user.
 * @param content The new HTML content to save from the editor.
 */
export async function saveNotes(userId: string, content: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if notes exist
    const { data: existing, error: fetchError } = await supabase
      .from('user_notes')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing notes:', fetchError);
      throw new Error('Failed to check existing notes');
    }

    if (existing) {
      // Update existing notes
      const { error: updateError } = await supabase
        .from('user_notes')
        .update({ content })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating notes:', updateError);
        throw new Error('Failed to update notes');
      }
    } else {
      // Create new notes entry
      const { error: insertError } = await supabase
        .from('user_notes')
        .insert({ user_id: userId, content });

      if (insertError) {
        console.error('Error creating notes:', insertError);
        throw new Error('Failed to create notes');
      }
    }
  } catch (err) {
    console.error('Exception in saveNotes:', err);
    throw err;
  }
}