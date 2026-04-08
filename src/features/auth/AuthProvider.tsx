import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import React, { createContext, useContext, useEffect } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setLoading(false);
      } else if (retryCount < 3) {
        // If profile not found, wait and retry (useful right after signup)
        setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
