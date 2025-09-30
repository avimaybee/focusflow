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
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
        let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (profileError && profileError.code === 'PGRST116') { // Not found, create it
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.id,
                    username: currentUser.user_metadata?.displayName || currentUser.email,
                })
                .select()
                .single();

            if (insertError) {
                console.error("Error creating profile:", insertError);
                setProfile(null);
            } else {
                profileData = newProfile;
            }
        } else if (profileError) {
            console.error('Error fetching profile on refresh:', profileError);
        }

        setProfile(profileData || null);
        if (profileData?.favorite_prompts) {
            setFavoritePrompts(profileData.favorite_prompts);
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