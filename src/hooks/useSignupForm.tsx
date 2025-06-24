
import { useReducer, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupState, SignupAction, SignupFormData } from '@/types/auth';
import { validateField, validateForm } from '@/utils/validation';
import { useAuthMutations } from '@/hooks/useAuthMutations';

const initialState: SignupState = {
  formData: {
    fullName: '',
    email: '',
    password: '',
  },
  errors: {},
  showPassword: false,
  showSuccess: false,
  isSubmitting: false,
};

const signupReducer = (state: SignupState, action: SignupAction): SignupState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
        errors: {
          ...state.errors,
          [action.field]: undefined,
        },
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
      };
    case 'TOGGLE_PASSWORD_VISIBILITY':
      return {
        ...state,
        showPassword: !state.showPassword,
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };
    case 'SET_SUCCESS':
      return {
        ...state,
        showSuccess: action.showSuccess,
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
};

export const useSignupForm = () => {
  const [state, dispatch] = useReducer(signupReducer, initialState);
  const { signUp } = useAuthMutations();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateField = useCallback((field: keyof SignupFormData, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const validateFieldOnBlur = useCallback((field: keyof SignupFormData, value: string) => {
    const error = validateField(field, value);
    if (error) {
      dispatch({ type: 'SET_ERRORS', errors: { [field]: error } });
    }
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_PASSWORD_VISIBILITY' });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(state.formData);
    
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: validationErrors });
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

    try {
      await signUp.mutateAsync({
        email: state.formData.email.trim().toLowerCase(),
        password: state.formData.password,
        fullName: state.formData.fullName.trim(),
      });
      
      dispatch({ type: 'SET_SUCCESS', showSuccess: true });
      
      timeoutRef.current = setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account created! Please check your email to confirm your account.',
            email: state.formData.email.trim().toLowerCase()
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Signup form error:', error);
      dispatch({ type: 'SET_ERRORS', errors: { general: 'An unexpected error occurred. Please try again.' } });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [state.formData, signUp, navigate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    updateField,
    validateFieldOnBlur,
    togglePasswordVisibility,
    handleSubmit,
    isPending: signUp.isPending,
  };
};
