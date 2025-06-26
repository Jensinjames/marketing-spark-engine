
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { secureLog, performSecurityChecks } from '@/utils/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
        secureLog('info', 'Auth state changed', { event, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle auth events with security logging
        switch (event) {
          case 'SIGNED_IN':
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
            secureLog('info', 'User signed out');
            // Clear any cached sensitive data on signout
            setUser(null);
            setSession(null);
            // Clear any stored tokens or sensitive data
            sessionStorage.clear();
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
        secureLog('error', 'Error getting session', error);
        toast.error('Authentication error occurred');
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
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
