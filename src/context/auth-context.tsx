
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  isGuest: boolean;
  preferredPersona: string | null;
  favoritePrompts: string[] | null;
  setFavoritePrompts: React.Dispatch<React.SetStateAction<string[] | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function creates the user document if it doesn't exist.
// It's the centralized logic to prevent race conditions.
const createUserDocumentIfNeeded = async (user: User) => {
  if (user.isAnonymous) return; // Do not create documents for guest users
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Document doesn't exist, so create it.
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || user.email?.split('@')[0] || 'New User',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        isPremium: false,
        preferredPersona: 'neutral',
        favoritePrompts: [],
      });
      console.log(`Created user document for UID: ${user.uid}`);
    } catch (error) {
      console.error(`Error creating user document for UID: ${user.uid}`, error);
    }
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [preferredPersona, setPreferredPersona] = useState<string | null>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<string[] | null>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        setIsGuest(user.isAnonymous);
        
        if (user.isAnonymous) {
            setIsPremium(false);
            setPreferredPersona('neutral');
            setFavoritePrompts([]);
            setLoading(false);
            return;
        }

        // Ensure user document exists before setting up the listener
        await createUserDocumentIfNeeded(user);

        const userRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (userSnap) => {
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setIsPremium(userData.isPremium || false);
                setPreferredPersona(userData.preferredPersona || 'neutral');
                setFavoritePrompts(userData.favoritePrompts || []);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
        });

        // Return the firestore unsubscribe function to be called on cleanup.
        return () => unsubscribeFirestore();
        
      } else {
        // User is signed out
        setUser(null);
        setIsPremium(false);
        setIsGuest(true);
        setPreferredPersona(null);
        setFavoritePrompts(null);
        setLoading(false);
      }
    });

    // Cleanup auth subscription on component unmount
    return () => unsubscribeAuth();
  }, []);

  const value = { user, loading, isPremium, isGuest, preferredPersona, favoritePrompts, setFavoritePrompts };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
