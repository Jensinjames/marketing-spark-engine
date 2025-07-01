
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService, SignUpData, SignInData } from '@/services/authService';
import { validateEmail, validatePassword, validateFullName, sanitizeInput } from '@/utils/auth/inputValidation';
import { isRateLimited, recordAttempt } from '@/utils/auth/rateLimiting';
import { logSecurityEvent } from '@/utils/auth/securityLogging';
import { toast } from 'sonner';

export const useAuthService = () => {
  const queryClient = useQueryClient();

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const { email, password, fullName } = data;
      
      // Input validation
      validateEmail(email);
      validatePassword(password);
      if (fullName) validateFullName(fullName);
      
      const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
      
      // Rate limiting check
      if (isRateLimited(`signup_${normalizedEmail}`)) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      
      await logSecurityEvent('signup_attempt', { email: normalizedEmail });
      
      const result = await AuthService.signUp({
        email: normalizedEmail,
        password,
        fullName: fullName ? sanitizeInput(fullName.trim()) : undefined
      });
      
      if (result.error) {
        recordAttempt(`signup_${normalizedEmail}`, false);
        await logSecurityEvent('signup_failed', { 
          email: normalizedEmail, 
          error: result.error.message 
        });
        throw result.error;
      }
      
      recordAttempt(`signup_${normalizedEmail}`, true);
      await logSecurityEvent('signup_success', { email: normalizedEmail });
      
      return result;
    },
    onSuccess: (data) => {
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Account created! Please check your email to confirm your account before signing in.', {
          duration: 5000,
        });
      } else if (data.user && data.user.email_confirmed_at) {
        toast.success('Account created and confirmed! You can now sign in.');
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.success('Account created successfully!');
      }
    },
    onError: (error: any) => {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('Invalid email') || error.message.includes('email format')) {
        toast.error('Please enter a valid email address.');
      } else if (error.message.includes('Password') || error.message.includes('12 characters')) {
        toast.error('Password must meet security requirements: 12+ characters with uppercase, lowercase, number, and special character.');
      } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
        toast.error('Too many attempts. Please wait before trying again.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      const { email, password } = data;
      
      // Input validation
      validateEmail(email);
      if (!password) throw new Error('Password is required');
      
      const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
      
      // Rate limiting check
      if (isRateLimited(`signin_${normalizedEmail}`)) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      await logSecurityEvent('signin_attempt', { email: normalizedEmail });
      
      const result = await AuthService.signIn({
        email: normalizedEmail,
        password,
      });
      
      if (result.error) {
        recordAttempt(`signin_${normalizedEmail}`, false);
        await logSecurityEvent('signin_failed', { 
          email: normalizedEmail, 
          error: result.error.message 
        });
        throw result.error;
      }
      
      recordAttempt(`signin_${normalizedEmail}`, true);
      await logSecurityEvent('signin_success', { email: normalizedEmail });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['admin-validation'] });
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
      await logSecurityEvent('signout_attempt');
      
      const result = await AuthService.signOut();
      
      if (result.error) {
        await logSecurityEvent('signout_failed', { error: result.error.message });
        throw result.error;
      }
      
      await logSecurityEvent('signout_success');
      
      // Clear local cache
      queryClient.clear();
      sessionStorage.clear();
      
      return result;
    },
    onSuccess: () => {
      toast.success('Signed out successfully');
      setTimeout(() => {
        window.location.replace('/');
      }, 300);
    },
    onError: (error: any) => {
      toast.error('You have been signed out');
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (email: string) => {
      validateEmail(email);
      const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
      
      if (isRateLimited(`confirm_${normalizedEmail}`)) {
        throw new Error('Please wait before requesting another confirmation email.');
      }
      
      await logSecurityEvent('resend_confirmation_attempt', { email: normalizedEmail });
      
      const result = await AuthService.resendConfirmation(normalizedEmail);
      
      if (result.error) {
        recordAttempt(`confirm_${normalizedEmail}`, false);
        await logSecurityEvent('resend_confirmation_failed', { 
          email: normalizedEmail, 
          error: result.error.message 
        });
        throw result.error;
      }
      
      recordAttempt(`confirm_${normalizedEmail}`, true);
      await logSecurityEvent('resend_confirmation_success', { email: normalizedEmail });
      
      return result;
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
    
    // Consolidated state
    isLoading: signUpMutation.isPending || 
               signInMutation.isPending || 
               signOutMutation.isPending || 
               resendConfirmationMutation.isPending,
    
    // Reset all mutations
    reset: () => {
      signUpMutation.reset();
      signInMutation.reset();
      signOutMutation.reset();
      resendConfirmationMutation.reset();
    }
  };
};
