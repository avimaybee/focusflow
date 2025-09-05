import { createContext, useContext, useState, ReactNode } from 'react';

// Mock User type, as the Firebase User type is no longer available.
type MockUser = {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

interface AuthContextType {
  user: MockUser | null;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // We'll provide a static "guest" context for now.
  // This will be replaced with Supabase auth later.
  const [favoritePrompts, setFavoritePrompts] = useState<string[] | null>([]);

  const value: AuthContextType = {
    user: null, // or a mock guest user: { uid: 'guest', isAnonymous: true, ... }
    loading: false,
    isPremium: false,
    isGuest: true,
    username: null,
    publicProfile: null,
    preferredPersona: 'neutral',
    favoritePrompts: favoritePrompts,
    setFavoritePrompts: setFavoritePrompts,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};