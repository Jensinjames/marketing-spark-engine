
import { useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Perform security checks on initialization
    const securityCheck = performSecurityChecks();
    if (!securityCheck.secure) {
      secureLog('warn', 'Security warnings detected', securityCheck.warnings);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
        secureLog('info', 'Auth state changed', { event, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle auth events with security logging
        switch (event) {
          case 'SIGNED_IN':
            console.log('[AuthProvider] User signed in successfully');
            secureLog('info', 'User signed in', { userId: session?.user?.id });
            // Log successful authentication for security monitoring
            try {
              await supabase.rpc('audit_sensitive_operation', {
                p_action: 'user_signin',
                p_table_name: 'auth_events',
                p_new_values: { 
                  user_id: session?.user?.id,
                  timestamp: new Date().toISOString()
                }
              });
            } catch (error) {
              secureLog('warn', 'Failed to audit signin event', error);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('[AuthProvider] User signed out - clearing all state');
            secureLog('info', 'User signed out');
            
            // Immediately clear state on signout
            setUser(null);
            setSession(null);
            
            // Clear any stored tokens or sensitive data
            sessionStorage.clear();
            
            // Remove specific auth keys from localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('supabase.auth')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            console.log('[AuthProvider] State cleared after signout');
            break;
            
          case 'TOKEN_REFRESHED':
            secureLog('info', 'Token refreshed successfully');
            break;
            
          case 'USER_UPDATED':
            secureLog('info', 'User profile updated', { userId: session?.user?.id });
            break;
            
          case 'PASSWORD_RECOVERY':
            secureLog('info', 'Password recovery initiated', { userId: session?.user?.id });
            break;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error getting session:', error);
        secureLog('error', 'Error getting session', error);
        toast.error('Authentication error occurred');
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
  }, []);

  const value = {
    user,
    session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
