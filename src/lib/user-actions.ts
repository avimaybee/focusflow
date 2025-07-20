import { doc, updateDoc, getDocs, collection, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
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
    await updateDoc(userRef, {
        ...profileData,
        onboardingCompleted: true,
    });
};
