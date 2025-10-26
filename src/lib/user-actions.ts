'use server';
import { isUsernameAvailable as checkUsernameAvailability } from './profile-actions'; // Renamed to avoid conflict
import type { Persona } from '@/types/chat-types';
import { getPersonas as fetchPersonasFromDB } from './persona-actions';

export interface UserProfile {
    username?: string;
    learningGoals?: string;
    preferredPersona?: string;
    onboardingCompleted?: boolean;
}

export const getPersonas = async () => {
    console.log('[PLACEHOLDER] getPersonas called - fetching from database');
    const dbPersonas = await fetchPersonasFromDB();
    return dbPersonas;
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    console.log(`[PLACEHOLDER] getUserProfile called for user ${userId}`);
    return {
        username: 'placeholder-user',
        learningGoals: 'Placeholder learning goals.',
        preferredPersona: 'Gurt',
        onboardingCompleted: true,
    };
};

export const updateUserProfile = async (userId: string, profileData: UserProfile) => {
    console.log(`[PLACEHOLDER] updateUserProfile called for user ${userId}, profileData:`, profileData);
    // Simulate username check if provided
    if (profileData.username) {
        const isAvailable = await checkUsernameAvailability(profileData.username);
        if (!isAvailable) {
            throw new Error('Username is already taken (placeholder).');
        }
    }
};

export const updateUserFavoritePrompts = async (userId: string, favoritePrompts: string[]) => {
    console.log(`[PLACEHOLDER] updateUserFavoritePrompts called for user ${userId}, favoritePrompts:`, favoritePrompts);
};