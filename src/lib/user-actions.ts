import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

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

export const updateUserPersona = async (userId: string, personaId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { preferredPersona: personaId });
};

export const updateUserOnboardingData = async (userId: string, data: { subject: string; learningStyle: string; preferredPersona: string; onboardingCompleted: boolean }) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
};