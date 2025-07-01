
import { supabase } from '@/integrations/supabase/client';

// Enhanced rate limiting with server-side validation
export const checkServerRateLimit = async (identifier: string, maxAttempts = 5, timeWindowMinutes = 15): Promise<boolean> => {
  try {
    const { data: isAllowed, error } = await supabase.rpc('check_rate_limit', {
      identifier,
      max_attempts: maxAttempts,
      time_window_minutes: timeWindowMinutes
    });

    if (error) {
      console.warn('Server rate limit check failed:', error);
      // Fall back to client-side rate limiting
      return isRateLimited(identifier);
    }

    return isAllowed;
  } catch (error) {
    console.warn('Rate limit service unavailable:', error);
    // Fall back to client-side rate limiting
    return isRateLimited(identifier);
  }
};

// Enhanced client-side rate limiting (fallback)
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const isRateLimited = (email: string): boolean => {
  const attempts = authAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
};

export const recordAttempt = (email: string, success: boolean) => {
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

// Enhanced input validation with XSS protection
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): void => {
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    throw new Error('Email is required');
  }
  
  if (sanitized.length > 254) {
    throw new Error('Email address is too long');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized.toLowerCase())) {
    throw new Error('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (!password) {
    throw new Error('Password is required');
  }
  
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password is too long');
  }
};

// Admin session validation
export const validateAdminAccess = async (): Promise<boolean> => {
  try {
    const { data: isValid, error } = await supabase.rpc('validate_admin_session');
    
    if (error) {
      console.error('Admin validation failed:', error);
      return false;
    }
    
    return isValid || false;
  } catch (error) {
    console.error('Admin validation service unavailable:', error);
    return false;
  }
};

// Security event logging
export const logSecurityEvent = async (eventType: string, eventData: any = {}) => {
  try {
    await supabase.rpc('log_security_event', {
      event_type: eventType,
      event_data: eventData
    });
  } catch (error) {
    // Silently fail security logging to not disrupt user flow
    console.warn('Security event logging failed:', error);
  }
};
