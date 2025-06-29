import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

// Security: Rate limiting state
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (email: string): boolean => {
  const attempts = authAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
};

const recordAttempt = (email: string, success: boolean) => {
  const now = Date.now();
  const attempts = authAttempts.get(email) || { count: 0, lastAttempt: now };
  
  if (success) {
    authAttempts.delete(email);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
    authAttempts.set(email, attempts);
  }
};

const logSecurityEvent = async (event: string, details: any) => {
  // Only log in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Security] ${event}:`, details);
  }
  
  // In production, you would send this to your security monitoring service
  try {
    await supabase.rpc('audit_sensitive_operation', {
      p_action: event,
      p_table_name: 'auth_events',
      p_new_values: details
    });
  } catch (error) {
    // Silently fail audit logging to not disrupt user experience
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to log security event:', error);
    }
  }
};

export const useAuthMutations = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: SignUpData) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Security: Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Security: Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error('Invalid email format');
      }
      
      // Security: Rate limiting
      if (isRateLimited(normalizedEmail)) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      await logSecurityEvent('signup_attempt', { email: normalizedEmail });
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName.trim() } : undefined
        }
      });

      if (error) {
        recordAttempt(normalizedEmail, false);
        await logSecurityEvent('signup_failed', { 
          email: normalizedEmail, 
          error: error.message 
        });
        throw error;
      }
      
      recordAttempt(normalizedEmail, true);
      await logSecurityEvent('signup_success', { email: normalizedEmail });
      
      return data;
    },
    onSuccess: (data) => {
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Account created! Please check your email to confirm your account before signing in.', {
          duration: 5000,
        });
      } else if (data.user && data.user.email_confirmed_at) {
        toast.success('Account created and confirmed! You can now sign in.');
        navigate('/dashboard');
      } else {
        toast.success('Account created successfully!');
      }
    },
    onError: (error: any) => {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('Invalid email') || error.message.includes('email format')) {
        toast.error('Please enter a valid email address.');
      } else if (error.message.includes('Password')) {
        toast.error('Password must be at least 8 characters long.');
      } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
        toast.error('Too many attempts. Please wait before trying again.');
      } else if (error.message.includes('Database error')) {
        toast.error('There was an issue creating your account. Please try again.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: SignInData) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Security: Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Security: Rate limiting
      if (isRateLimited(normalizedEmail)) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      await logSecurityEvent('signin_attempt', { email: normalizedEmail });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        recordAttempt(normalizedEmail, false);
        await logSecurityEvent('signin_failed', { 
          email: normalizedEmail, 
          error: error.message 
        });
        throw error;
      }
      
      recordAttempt(normalizedEmail, true);
      await logSecurityEvent('signin_success', { email: normalizedEmail });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      if (error.message.includes('Invalid credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first.');
      } else if (error.message.includes('too many') || error.message.includes('rate limit')) {
        toast.error('Too many login attempts. Please wait a moment and try again.');
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.');
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Logout] Starting logout process...');
      await logSecurityEvent('signout_attempt', {});
      
      // Clear all React Query cache immediately to prevent stale data
      queryClient.clear();
      console.log('[Logout] Query cache cleared');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Logout] Supabase signout failed:', error);
        await logSecurityEvent('signout_failed', { error: error.message });
        throw error;
      }
      
      console.log('[Logout] Supabase signout successful');
      
      // Clear session storage and local storage to remove any cached auth data
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      await logSecurityEvent('signout_success', {});
      console.log('[Logout] Logout process completed successfully');
    },
    onSuccess: () => {
      console.log('[Logout] Success callback executing...');
      toast.success('Signed out successfully');
      
      // Force navigation to home page
      window.location.href = '/';
    },
    onError: (error: any) => {
      console.error('[Logout] Error during logout:', error);
      toast.error('Error signing out. Please try again.');
      
      // Even if there's an error, try to navigate home as a fallback
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Security: Rate limiting for confirmation emails
      if (isRateLimited(`confirm_${normalizedEmail}`)) {
        throw new Error('Please wait before requesting another confirmation email.');
      }
      
      await logSecurityEvent('resend_confirmation_attempt', { email: normalizedEmail });
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        recordAttempt(`confirm_${normalizedEmail}`, false);
        await logSecurityEvent('resend_confirmation_failed', { 
          email: normalizedEmail, 
          error: error.message 
        });
        throw error;
      }
      
      recordAttempt(`confirm_${normalizedEmail}`, true);
      await logSecurityEvent('resend_confirmation_success', { email: normalizedEmail });
    },
    onSuccess: () => {
      toast.success('Confirmation email sent! Please check your inbox and spam folder.');
    },
    onError: (error: any) => {
      if (error.message.includes('rate limit') || error.message.includes('wait')) {
        toast.error('Please wait before requesting another confirmation email.');
      } else {
        toast.error(error.message || 'Failed to resend confirmation email');
      }
    },
  });

  return {
    signUp: signUpMutation,
    signIn: signInMutation,
    signOut: signOutMutation,
    resendConfirmation: resendConfirmationMutation,
  };
};
