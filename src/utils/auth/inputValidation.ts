
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

  // Check for minimum complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }
};

export const validateFullName = (fullName: string): void => {
  const sanitized = sanitizeInput(fullName);
  
  if (!sanitized) {
    throw new Error('Full name is required');
  }
  
  if (sanitized.length < 2) {
    throw new Error('Full name must be at least 2 characters long');
  }
  
  if (sanitized.length > 100) {
    throw new Error('Full name is too long');
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    throw new Error('Full name contains invalid characters');
  }
};
