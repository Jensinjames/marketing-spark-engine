
// Security: Rate limiting state
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

export const validateEmail = (email: string): void => {
  if (!email) {
    throw new Error('Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim().toLowerCase())) {
    throw new Error('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (!password) {
    throw new Error('Password is required');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
};
