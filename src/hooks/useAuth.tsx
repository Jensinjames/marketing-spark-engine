
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle auth events with security logging
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          toast.success('Successfully signed out!');
          // Clear any cached data on signout
          setUser(null);
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        toast.error('Authentication error occurred');
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      
      // Input validation
      if (!email || !password) {
        const error = { message: 'Email and password are required' };
        toast.error(error.message);
        return { error };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error = { message: 'Please enter a valid email address' };
        toast.error(error.message);
        return { error };
      }

      // Password strength validation
      if (password.length < 8) {
        const error = { message: 'Password must be at least 8 characters long' };
        toast.error(error.message);
        return { error };
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('Attempting signup for:', email);
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName.trim() } : undefined
        }
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Try signing in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        console.log('Signup successful for:', email);
        toast.success('Check your email to confirm your account!');
      }

      return { error };
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      const errorMessage = 'An unexpected error occurred during signup';
      toast.error(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Input validation
      if (!email || !password) {
        const error = { message: 'Email and password are required' };
        toast.error(error.message);
        return { error };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error = { message: 'Please enter a valid email address' };
        toast.error(error.message);
        return { error };
      }

      console.log('Attempting signin for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        if (error.message.includes('Invalid credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account first.');
        } else {
          toast.error(error.message);
        }
      } else {
        console.log('Signin successful for:', email);
      }

      return { error };
    } catch (error: any) {
      console.error('Unexpected signin error:', error);
      const errorMessage = 'An unexpected error occurred during signin';
      toast.error(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Attempting signout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Signout error:', error);
        toast.error('Error signing out');
      } else {
        console.log('Signout successful');
        // Clear state immediately for security
        setUser(null);
        setSession(null);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Unexpected signout error:', error);
      const errorMessage = 'An unexpected error occurred during signout';
      toast.error(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
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
