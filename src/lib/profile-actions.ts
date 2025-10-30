'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PublicProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  school: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * Get a user's profile by user ID
 */
export async function getProfile(userId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in getProfile:', err);
    return null;
  }
}

/**
 * Checks if a username is available.
 * @param username The username to check.
 * @returns True if the username is available, false otherwise.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking username availability:', error);
      return false;
    }

    return !data; // Available if no data found
  } catch (err) {
    console.error('Exception in isUsernameAvailable:', err);
    return false;
  }
}

/**
 * Updates a user's public profile and username.
 * @param userId The ID of the user.
 * @param username The new username.
 * @param profileData The new profile data.
 */
export async function updateUserProfile(
  userId: string,
  username: string,
  profileData: z.infer<typeof PublicProfileSchema>
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate profile data
    const validatedData = PublicProfileSchema.parse(profileData);
    
    // Check if username is available (if changing)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (currentProfile && currentProfile.username !== username.toLowerCase()) {
      const available = await isUsernameAvailable(username);
      if (!available) {
        throw new Error('Username is already taken');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase(),
        display_name: validatedData.displayName,
        bio: validatedData.bio,
        school: validatedData.school,
        avatar_url: validatedData.avatarUrl,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }

    return { success: true, profile: data };
  } catch (err) {
    console.error('Exception in updateUserProfile:', err);
    throw err;
  }
}

/**
 * Fetches a user's public profile and content by their username.
 * @param username The username of the user.
 * @returns The user's public profile and content, or null if not found.
 */
export async function getPublicProfile(username: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) {
      console.error('Error fetching public profile:', profileError);
      return null;
    }

    // Get public content
    const [summaries, flashcardSets, quizzes, studyPlans] = await Promise.all([
      supabase
        .from('summaries')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
    ]);

    const content = [
      ...(summaries.data || []).map((s) => ({ ...s, type: 'summary' })),
      ...(flashcardSets.data || []).map((f) => ({ ...f, type: 'flashcardSet' })),
      ...(quizzes.data || []).map((q) => ({ ...q, type: 'quiz' })),
      ...(studyPlans.data || []).map((p) => ({ ...p, type: 'studyPlan' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      profile: {
        displayName: profile.display_name,
        bio: profile.bio,
        school: profile.school,
        avatarUrl: profile.avatar_url,
        username: profile.username,
      },
      content,
    };
  } catch (err) {
    console.error('Exception in getPublicProfile:', err);
    return null;
  }
}

const getCollectionName = (type: string) => {
    if (type === 'summary') return 'summaries';
    if (type === 'quiz') return 'quizzes';
    if (type === 'flashcardSet') return 'flashcard_sets';
    if (type === 'studyPlan') return 'study_plans';
    throw new Error(`Invalid content type: ${type}`);
};

/**
 * Increments the helpful count for a piece of content.
 * @param authorId The ID of the user who created the content.
 * @param contentId The ID of the content.
 * @param contentType The type of the content.
 */
export async function incrementHelpfulCount(authorId: string, contentId: string, contentType: string) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const tableName = getCollectionName(contentType);
      
      // Increment the helpful_count field
      const { data, error } = await supabase.rpc('increment_helpful_count', {
        table_name: tableName,
        content_id: contentId,
      });

      if (error) {
        console.error('Error incrementing helpful count:', error);
        // Fallback: manual increment
        const { data: content } = await supabase
          .from(tableName)
          .select('helpful_count')
          .eq('id', contentId)
          .single();

        if (content) {
          await supabase
            .from(tableName)
            .update({ helpful_count: (content.helpful_count || 0) + 1 })
            .eq('id', contentId);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Exception in incrementHelpfulCount:', err);
      return { success: false };
    }
}

/**
 * Increments the view count for a piece of content.
 * @param authorId The ID of the user who created the content.
 * @param contentId The ID of the content.
 * @param contentType The type of the content.
 */
export async function incrementViews(authorId: string, contentId: string, contentType: string) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const tableName = getCollectionName(contentType);
      
      // Increment the view_count field
      const { data: content } = await supabase
        .from(tableName)
        .select('view_count')
        .eq('id', contentId)
        .single();

      if (content) {
        await supabase
          .from(tableName)
          .update({ view_count: (content.view_count || 0) + 1 })
          .eq('id', contentId);
      }

      return { success: true };
    } catch (err) {
      console.error('Exception in incrementViews:', err);
      return { success: false };
    }
}

/**
 * Get user's favorite prompts
 */
export async function getFavoritePrompts(userId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('favorite_prompts')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching favorite prompts:', error);
      return [];
    }

    return data?.favorite_prompts || [];
  } catch (err) {
    console.error('Exception in getFavoritePrompts:', err);
    return [];
  }
}

/**
 * Update user's favorite prompts
 */
export async function updateFavoritePrompts(userId: string, prompts: string[]) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ favorite_prompts: prompts })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating favorite prompts:', error);
      throw new Error('Failed to update favorite prompts');
    }

    return { success: true, prompts: data.favorite_prompts };
  } catch (err) {
    console.error('Exception in updateFavoritePrompts:', err);
    throw err;
  }
}

/**
 * Update user preferences (persona, learning goals, etc.)
 */
export async function updatePreferences(
  userId: string,
  preferences: {
    preferred_persona?: string;
    learning_goals?: string;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }

    return { success: true, profile: data };
  } catch (err) {
    console.error('Exception in updatePreferences:', err);
    throw err;
  }
}