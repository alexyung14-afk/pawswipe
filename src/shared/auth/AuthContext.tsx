import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../db/supabaseClient';
import { getPendingReferral } from '../referral/pendingReferral';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    // Passed as signup metadata rather than written directly: email confirmation means
    // there's no authenticated session yet when this resolves, so a client-side insert
    // into referrals would be blocked by RLS. A database trigger records it instead,
    // reading this metadata off the new auth.users row (see migration 0012).
    const pending = await getPendingReferral();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: pending
        ? {
            data: {
              referral_animal_id: pending.animalId,
              referral_referrer_id: pending.ref ?? undefined,
            },
          }
        : undefined,
    });

    return { error: error ? error.message : null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount: AuthContextValue['deleteAccount'] = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      return { error: error.message };
    }
    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
