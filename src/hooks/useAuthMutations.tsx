
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

export const useAuthMutations = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: SignUpData) => {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName.trim() } : undefined
        }
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('Signup successful:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Signup mutation successful:', data.user?.email);
      
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
      console.error('Signup mutation error:', error);
      
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('Invalid email')) {
        toast.error('Please enter a valid email address.');
      } else if (error.message.includes('Password')) {
        toast.error('Password must be at least 8 characters long.');
      } else if (error.message.includes('Database error')) {
        toast.error('There was an issue creating your account. Please try again.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: SignInData) => {
      console.log('Starting signin process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        throw error;
      }
      
      console.log('Signin successful:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Signin mutation successful:', data.user?.email);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      console.error('Signin mutation error:', error);
      
      if (error.message.includes('Invalid credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first.');
      } else if (error.message.includes('too many requests')) {
        toast.error('Too many login attempts. Please wait a moment and try again.');
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.');
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting signout process');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        throw error;
      }
      console.log('Signout successful');
    },
    onSuccess: () => {
      console.log('Signout mutation successful');
      queryClient.clear();
      toast.success('Signed out successfully');
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Signout mutation error:', error);
      toast.error('Error signing out. Please try again.');
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Resending confirmation email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        throw error;
      }
      
      console.log('Confirmation email resent successfully');
    },
    onSuccess: () => {
      toast.success('Confirmation email sent! Please check your inbox and spam folder.');
    },
    onError: (error: any) => {
      console.error('Resend confirmation mutation error:', error);
      if (error.message.includes('rate limit')) {
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
