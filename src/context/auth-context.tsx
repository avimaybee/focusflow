
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  preferredPersona: string | null;
  favoritePrompts: string[] | null;
  setFavoritePrompts: React.Dispatch<React.SetStateAction<string[] | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [preferredPersona, setPreferredPersona] = useState<string | null>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<string[] | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Set up a realtime listener for user data from Firestore.
        // The user document is now created by the `onUserCreate` Cloud Function.
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
        setPreferredPersona(null);
        setFavoritePrompts(null);
        setLoading(false);
      }
    });

    // Cleanup auth subscription on component unmount
    return () => unsubscribeAuth();
  }, []);

  const value = { user, loading, isPremium, preferredPersona, favoritePrompts, setFavoritePrompts };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
