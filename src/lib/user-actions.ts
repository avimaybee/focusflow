'use server';

import { supabase } from './supabase';
import { isUsernameAvailable as checkUsernameAvailability } from './profile-actions';
import { getPersonas as fetchPersonasFromDB } from './persona-actions';

export interface UserProfile {
    username?: string;
    learningGoals?: string;
    preferredPersona?: string;
    onboardingCompleted?: boolean;
    isPremium?: boolean;
    favoritePrompts?: string[];
}

/**
 * Get all available personas from the database
 */
export const getPersonas = async () => {
    console.log('[getPersonas] Fetching personas from database');
    const dbPersonas = await fetchPersonasFromDB();
    return dbPersonas;
};

/**
 * Get user profile data from Supabase
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        console.log(`[getUserProfile] Fetching profile for user ${userId}`);
        
        const { data, error } = await supabase
            .from('profiles')
            .select('username, is_premium, preferred_persona, favorite_prompts')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[getUserProfile] Error:', error);
            return null;
        }

        if (!data) {
            console.warn('[getUserProfile] No profile found for user:', userId);
            return null;
        }

        return {
            username: data.username,
            preferredPersona: data.preferred_persona,
            isPremium: data.is_premium,
            favoritePrompts: data.favorite_prompts || [],
            onboardingCompleted: !!data.username, // If they have a username, onboarding is likely complete
        };
    } catch (error) {
        console.error('[getUserProfile] Unexpected error:', error);
        return null;
    }
};

/**
 * Update user profile data in Supabase
 */
export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    try {
        console.log(`[updateUserProfile] Updating profile for user ${userId}`);

        // Check username availability if username is being updated
        if (profileData.username) {
            const isAvailable = await checkUsernameAvailability(profileData.username);
            if (!isAvailable) {
                throw new Error('Username is already taken');
            }
        }

        // Map the profile data to database columns
        const updateData: Record<string, any> = {};
        if (profileData.username !== undefined) updateData.username = profileData.username;
        if (profileData.preferredPersona !== undefined) updateData.preferred_persona = profileData.preferredPersona;
        if (profileData.favoritePrompts !== undefined) updateData.favorite_prompts = profileData.favoritePrompts;

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('[updateUserProfile] Error:', error);
            throw new Error(`Failed to update profile: ${error.message}`);
        }

        console.log('[updateUserProfile] Profile updated successfully');
    } catch (error) {
        console.error('[updateUserProfile] Unexpected error:', error);
        throw error;
    }
};

/**
 * Update user's favorite prompts
 */
export const updateUserFavoritePrompts = async (userId: string, favoritePrompts: string[]) => {
    try {
        console.log(`[updateUserFavoritePrompts] Updating favorite prompts for user ${userId}`);

        const { error } = await supabase
            .from('profiles')
            .update({ favorite_prompts: favoritePrompts })
            .eq('id', userId);

        if (error) {
            console.error('[updateUserFavoritePrompts] Error:', error);
            throw new Error(`Failed to update favorite prompts: ${error.message}`);
        }

        console.log('[updateUserFavoritePrompts] Favorite prompts updated successfully');
    } catch (error) {
        console.error('[updateUserFavoritePrompts] Unexpected error:', error);
        throw error;
    }
};