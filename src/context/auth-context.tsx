
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, 'users', user.uid);
        
        // Use set with merge to create or update the user document.
        // This handles first-time sign-in gracefully (e.g., with Google).
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
            console.error("Error ensuring user document exists:", error);
        }

        // Set up a realtime listener for user data
        const unsubFromUserDoc = onSnapshot(userRef, (userSnap) => {
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

        return () => unsubFromUserDoc();
        
      } else {
        setUser(null);
        setIsPremium(false);
        setPreferredPersona(null);
        setFavoritePrompts(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading, isPremium, preferredPersona, favoritePrompts, setFavoritePrompts };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
