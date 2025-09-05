
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useOnboardingModal } from '@/hooks/use-onboarding-modal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  isGuest: boolean;
  username: string | null;
  publicProfile: any | null;
  preferredPersona: string | null;
  favoritePrompts: string[] | null;
  setFavoritePrompts: React.Dispatch<React.SetStateAction<string[] | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function creates the user document if it doesn't exist.
// It's the centralized logic to prevent race conditions.
const createUserDocumentIfNeeded = async (user: User) => {
  if (user.isAnonymous) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    try {
      // Generate a unique username
      const baseUsername = user.email?.split('@')[0] || `user${user.uid.substring(0, 5)}`;
      let username = baseUsername;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        const usernameRef = doc(db, 'usernames', username);
        const usernameSnap = await getDoc(usernameRef);
        if (!usernameSnap.exists()) {
          isUnique = true;
        } else {
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
        }
        attempts++;
      }
      if (!isUnique) {
          username = `user${user.uid}`; // Fallback to UID
      }

      const batch = writeBatch(db);

      batch.set(userRef, {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || user.email?.split('@')[0] || 'New User',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        isPremium: false,
        username: username,
        publicProfile: {
            displayName: user.displayName || user.email?.split('@')[0] || 'New User',
            bio: '',
            school: '',
            avatarUrl: user.photoURL || '',
        },
        preferredPersona: 'neutral',
        favoritePrompts: [],
        onboardingCompleted: false,
      });

      const usernameRef = doc(db, 'usernames', username);
      batch.set(usernameRef, { userId: user.uid });

      await batch.commit();
      console.log(`Created user document for UID: ${user.uid} with username ${username}`);
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
  const [username, setUsername] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<any | null>(null);
  const [preferredPersona, setPreferredPersona] = useState<string | null>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<string[] | null>([]);
  const { onOpen: openOnboardingModal } = useOnboardingModal();

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
            setUsername(null);
            setPublicProfile(null);
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
                setUsername(userData.username || null);
                setPublicProfile(userData.publicProfile || null);

                // Trigger onboarding if not completed
                if (!userData.onboardingCompleted) {
                  openOnboardingModal();
                }
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
        setUsername(null);
        setPublicProfile(null);
        setLoading(false);
      }
    });

    // Cleanup auth subscription on component unmount
    return () => unsubscribeAuth();
  }, [openOnboardingModal]);

  const value = { user, loading, isPremium, isGuest, username, publicProfile, preferredPersona, favoritePrompts, setFavoritePrompts };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
