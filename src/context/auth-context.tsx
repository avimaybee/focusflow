
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Create user document if it doesn't exist (e.g., for Google sign-in)
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            isPremium: false,
            preferredPersona: 'neutral',
            favoritePrompts: [],
          };
          await setDoc(userRef, newUser);
          setIsPremium(newUser.isPremium);
          setPreferredPersona(newUser.preferredPersona);
          setFavoritePrompts(newUser.favoritePrompts);
        } else {
            const userData = userSnap.data();
            setIsPremium(userData.isPremium || false);
            setPreferredPersona(userData.preferredPersona || 'neutral');
            setFavoritePrompts(userData.favoritePrompts || []);
        }
        setUser(user);
      } else {
        setUser(null);
        setIsPremium(false);
        setPreferredPersona(null);
        setFavoritePrompts(null);
      }
      setLoading(false);
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
