import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSigningOut: boolean;
  hasCheckedAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    isSigningOut: false,
    hasCheckedAdmin: false,
  });

  const signOut = useCallback(async () => {
    // Set signing out flag FIRST to prevent any redirects
    setAuthState(prev => ({ ...prev, isSigningOut: true, isLoading: true }));
    
    // Clear localStorage auth data immediately
    try {
      // Clear Supabase auth storage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }

    // Sign out from Supabase (don't await - it might fail if session is already gone)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      // Ignore errors - session might already be invalid
      console.log('SignOut completed (session may have been expired)');
    }

    // Clear state completely
    setAuthState({
      user: null,
      session: null,
      isLoading: false,
      isAdmin: false,
      isSigningOut: false,
      hasCheckedAdmin: true,
    });

    return true; // Signal logout complete
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST (synchronous only!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Don't process auth changes while signing out
        if (authState.isSigningOut) {
          return;
        }

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            isSigningOut: false,
          });
          return;
        }

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
              setAuthState(prev => {
                // Don't update if we're signing out
                if (prev.isSigningOut) return prev;
                return {
                  ...prev,
                  user: session.user,
                  session,
                  isLoading: false,
                  isAdmin,
                };
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
          setAuthState(prev => {
            if (prev.isSigningOut) return prev;
            return {
              ...prev,
              user: session.user,
              session,
              isLoading: false,
              isAdmin,
            };
          });
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          isLoading: false,
          isAdmin: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [authState.isSigningOut]);

  return { ...authState, signOut };
}

async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    // Check for any admin-level role - use limit(1) instead of maybeSingle()
    // to handle users with multiple admin roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['org_admin', 'super_admin', 'content_editor', 'manager', 'dpo'])
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

// Legacy export for backwards compatibility
export async function signOutLegacy() {
  await supabase.auth.signOut();
}
