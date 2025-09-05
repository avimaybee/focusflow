'use server';
import { isUsernameAvailable as checkUsernameAvailability } from './profile-actions'; // Renamed to avoid conflict
import type { Persona } from '@/types/chat-types';

export interface UserProfile {
    username?: string;
    learningGoals?: string;
    preferredPersona?: string;
    onboardingCompleted?: boolean;
}

export const getPersonas = async (): Promise<Persona[]> => {
    console.log('[PLACEHOLDER] getPersonas called');
    return [
        { id: 'neutral', name: 'Neutral', prompt: 'You are a helpful AI study assistant.' },
        { id: 'socratic', name: 'Socratic', prompt: 'You are a Socratic tutor.' },
    ];
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    console.log(`[PLACEHOLDER] getUserProfile called for user ${userId}`);
    return {
        username: 'placeholder-user',
        learningGoals: 'Placeholder learning goals.',
        preferredPersona: 'neutral',
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