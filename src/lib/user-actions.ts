import { doc, updateDoc, getDocs, collection, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { isUsernameAvailable } from './profile-actions';

export interface UserProfile {
    username?: string;
    learningGoals?: string;
    preferredPersona?: string;
    onboardingCompleted?: boolean;
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    prompt: string;
}

export const getPersonas = async (): Promise<Persona[]> => {
    const personasCollection = collection(db, 'personas');
    const snapshot = await getDocs(personasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona));
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
    const userRef = doc(db, 'users', userId);
    const batch = writeBatch(db);

    const { username, ...restOfProfile } = profileData;

    if (username) {
        const isAvailable = await isUsernameAvailable(username);
        if (!isAvailable) {
            throw new Error('Username is already taken.');
        }
        const usernameRef = doc(db, 'usernames', username);
        batch.set(usernameRef, { userId });
        batch.update(userRef, { username });
    }

    batch.update(userRef, {
        ...restOfProfile,
        onboardingCompleted: true,
    });

    await batch.commit();
};
