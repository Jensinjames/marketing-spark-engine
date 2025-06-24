
import { ValidationErrors, SignupFormData } from '@/types/auth';

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const VALIDATION_MESSAGES = {
  FULL_NAME_REQUIRED: 'Full name is required',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`,
} as const;

export const validateField = (field: keyof SignupFormData, value: string): string | null => {
  switch (field) {
    case 'fullName':
      return !value.trim() ? VALIDATION_MESSAGES.FULL_NAME_REQUIRED : null;
    case 'email':
      if (!value.trim()) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
      if (!VALIDATION_RULES.EMAIL_REGEX.test(value)) return VALIDATION_MESSAGES.EMAIL_INVALID;
      return null;
    case 'password':
      if (!value.trim()) return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
      if (value.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
      return null;
    default:
      return null;
  }
};

export const validateForm = (formData: SignupFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(formData).forEach((key) => {
    const field = key as keyof SignupFormData;
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};
