
import { supabase } from '@/integrations/supabase/client';

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isValid: boolean;
}

export const validatePasswordStrength = async (password: string): Promise<PasswordStrength> => {
  const feedback: string[] = [];
  let score = 0;

  // Basic length check
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters long');
  } else {
    score += 1;
  }

  // Character type checks
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Server-side validation
  try {
    const { data: isValid, error } = await supabase.rpc('enhanced_password_validation', {
      password
    });

    if (error) {
      console.warn('Server-side password validation failed:', error);
      // Continue with client-side validation only
    } else if (isValid) {
      score = Math.max(score, 5); // Ensure perfect score if server validates
    }
  } catch (error) {
    console.warn('Password validation service unavailable:', error);
    // Continue with client-side validation only
  }

  return {
    score,
    feedback,
    isValid: score >= 5 && feedback.length === 0
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 1) return 'bg-red-500';
  if (score <= 2) return 'bg-orange-500';
  if (score <= 3) return 'bg-yellow-500';
  if (score <= 4) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getPasswordStrengthText = (score: number): string => {
  if (score <= 1) return 'Very Weak';
  if (score <= 2) return 'Weak';
  if (score <= 3) return 'Fair';
  if (score <= 4) return 'Good';
  return 'Strong';
};
