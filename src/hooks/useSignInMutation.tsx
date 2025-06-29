
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isRateLimited, recordAttempt, validateEmail } from '@/utils/authSecurity';
import { logSecurityEvent } from '@/utils/authLogging';

interface SignInData {
  email: string;
  password: string;
}

export const useSignInMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: SignInData) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Security: Input validation
      validateEmail(normalizedEmail);
      if (!password) {
        throw new Error('Password is required');
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
};
