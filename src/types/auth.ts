
export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export interface SignupState {
  formData: SignupFormData;
  errors: ValidationErrors;
  showPassword: boolean;
  showSuccess: boolean;
  isSubmitting: boolean;
}

export type SignupAction = 
  | { type: 'UPDATE_FIELD'; field: keyof SignupFormData; value: string }
  | { type: 'SET_ERRORS'; errors: ValidationErrors }
  | { type: 'TOGGLE_PASSWORD_VISIBILITY' }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_SUCCESS'; showSuccess: boolean }
  | { type: 'RESET_FORM' };
