import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST (synchronous only!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          isLoading: session?.user ? true : false, // Keep loading if we need to check admin
          isAdmin: session?.user ? prev.isAdmin : false,
        }));
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id).then((isAdmin) => {
              setAuthState({
                user: session.user,
                session,
                isLoading: false,
                isAdmin,
              });
            });
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdminRole(session.user.id).then((isAdmin) => {
          setAuthState({
            user: session.user,
            session,
            isLoading: false,
            isAdmin,
          });
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAdmin: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return authState;
}

async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    // Check for any admin-level role - use limit(1) instead of maybeSingle()
    // to handle users with multiple admin roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['org_admin', 'super_admin', 'content_editor', 'manager'])
      .limit(1);

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    // Returns true if at least one admin role exists
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}
