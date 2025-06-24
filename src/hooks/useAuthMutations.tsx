
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
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName.trim() } : undefined
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Signup successful:', data.user?.email);
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Please check your email to confirm your account!');
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: SignInData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Signin successful:', data.user?.email);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
    },
    onError: (error: any) => {
      console.error('Signin error:', error);
      if (error.message.includes('Invalid credentials')) {
        toast.error('Invalid email or password. If you just signed up, please check your email to confirm your account first.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account first.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Signout successful');
      queryClient.clear();
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Signout error:', error);
      toast.error('Error signing out');
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Confirmation email sent! Please check your inbox.');
    },
    onError: (error: any) => {
      console.error('Resend confirmation error:', error);
      toast.error(error.message || 'Failed to resend confirmation email');
    },
  });

  return {
    signUp: signUpMutation,
    signIn: signInMutation,
    signOut: signOutMutation,
    resendConfirmation: resendConfirmationMutation,
  };
};
