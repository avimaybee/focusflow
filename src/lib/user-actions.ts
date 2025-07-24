
'use server';
import { doc, updateDoc, getDocs, collection, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { isUsernameAvailable as checkUsernameAvailability } from './profile-actions'; // Renamed to avoid conflict
import type { Persona } from '@/types/chat-types';

export interface UserProfile {
    username?: string;
    learningGoals?: string;
    preferredPersona?: string;
    onboardingCompleted?: boolean;
}

export const getPersonas = async (): Promise<Persona[]> => {
    const personasCollection = collection(db, 'personas');
    const snapshot = await getDocs(personasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Persona));
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
    }
    return {};
};

export const updateUserProfile = async (userId: string, profileData: UserProfile) => {
    if (!userId) {
        throw new Error("User ID is required to update profile.");
    }
    
    const userRef = doc(db, 'users', userId);
    const batch = writeBatch(db);

    const { username, ...restOfProfile } = profileData;

    if (username) {
        const userDoc = await getDoc(userRef);
        const currentUsername = userDoc.data()?.username;
        if (username !== currentUsername) {
            const isAvailable = await checkUsernameAvailability(username);
            if (!isAvailable) {
                throw new Error('Username is already taken.');
            }
            const usernameRef = doc(db, 'usernames', username);
            batch.set(usernameRef, { userId });
            batch.update(userRef, { username });

            // If old username exists, remove it from the lookup
            if (currentUsername) {
                const oldUsernameRef = doc(db, 'usernames', currentUsername);
                batch.delete(oldUsernameRef);
            }
        }
    }

    batch.update(userRef, restOfProfile);

    await batch.commit();
};

export const updateUserFavoritePrompts = async (userId: string, favoritePrompts: string[]) => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { favoritePrompts });
};
