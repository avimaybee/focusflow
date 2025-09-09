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
    console.log('[AuthContext] refreshAuthStatus called.');
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[AuthContext] getSession returned:', session);
    setUser(session?.user ?? null);
    console.log('[AuthContext] user state set to:', session?.user ?? null);

    if (session?.user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('[AuthContext] Error fetching profile on refresh:', error);
        }
        console.log('[AuthContext] Profile fetched:', data);
        setProfile(data);
        if (data?.favorite_prompts) {
            setFavoritePrompts(data.favorite_prompts);
        }
    } else {
        console.log('[AuthContext] No user session, setting profile to null.');
        setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] onAuthStateChange event:', event, 'session:', session);
        refreshAuthStatus();
      }
    );

    // Initial check
    refreshAuthStatus();

    return () => {
      authListener?.unsubscribe();
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