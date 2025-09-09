'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the public profile
export interface Profile {
  username: string | null;
  is_premium: boolean;
  preferred_persona: string | null;
  favorite_prompts: string[] | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  isPremium: boolean;
  username: string | null;
  preferredPersona: string | null;
  favoritePrompts: string[] | null;
  setFavoritePrompts: React.Dispatch<React.SetStateAction<string[] | null>>;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoritePrompts, setFavoritePrompts] = useState<string[] | null>([]);

  const refreshAuthStatus = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id);

        if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
            console.error('Error fetching profile on refresh:', error);
        }

        // data will be an array. If a profile exists, it will be the first element.
        setProfile(data?.[0] || null);
        if (data?.favorite_prompts) {
            setFavoritePrompts(data.favorite_prompts);
        }
    } else {
        setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        refreshAuthStatus();
      }
    );

    // Initial check
    refreshAuthStatus();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isGuest: !user,
    isPremium: profile?.is_premium ?? false,
    username: profile?.username ?? null,
    preferredPersona: profile?.preferred_persona ?? 'neutral',
    favoritePrompts,
    setFavoritePrompts,
    refreshAuthStatus,
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