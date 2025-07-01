
// Client-side rate limiting (fallback when server-side fails)
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const isRateLimited = (identifier: string): boolean => {
  const attempts = authAttempts.get(identifier);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.delete(identifier);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
};

export const recordAttempt = (identifier: string, success: boolean) => {
  const now = Date.now();
  const attempts = authAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (success) {
    authAttempts.delete(identifier);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
    authAttempts.set(identifier, attempts);
  }
};

export const clearAttempts = (identifier: string) => {
  authAttempts.delete(identifier);
};

export const getRemainingAttempts = (identifier: string): number => {
  const attempts = authAttempts.get(identifier);
  if (!attempts) return MAX_ATTEMPTS;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.delete(identifier);
    return MAX_ATTEMPTS;
  }
  
  return Math.max(0, MAX_ATTEMPTS - attempts.count);
};
