
import { useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { secureLog, performSecurityChecks } from '@/utils/security';
import { AuthContext } from '@/contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoized cleanup function
  const performCleanup = useCallback(() => {
    console.log('[AuthProvider] Performing cleanup...');
    setUser(null);
    setSession(null);
    
    // Clear storage more efficiently
    try {
      sessionStorage.clear();
      
      // Only clear Supabase-related localStorage keys
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[AuthProvider] Storage cleanup failed:', error);
    }
  }, []);

  useEffect(() => {
    // Perform security checks on initialization (non-blocking)
    const securityCheck = performSecurityChecks();
    if (!securityCheck.secure) {
      secureLog('warn', 'Security warnings detected', securityCheck.warnings);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle auth events efficiently
        switch (event) {
          case 'SIGNED_IN':
            console.log('[AuthProvider] User signed in successfully');
            secureLog('info', 'User signed in', { userId: session?.user?.id });
            break;
            
          case 'SIGNED_OUT':
            console.log('[AuthProvider] User signed out - clearing state');
            secureLog('info', 'User signed out');
            performCleanup();
            break;
            
          case 'TOKEN_REFRESHED':
            secureLog('info', 'Token refreshed successfully');
            break;
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error getting session:', error);
        secureLog('error', 'Error getting session', error);
        // Don't show toast for initial session check failures
      }
      
      console.log('[AuthProvider] Initial session check:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [performCleanup]);

  const value = {
    user,
    session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
