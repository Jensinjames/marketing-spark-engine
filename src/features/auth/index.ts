
// Auth feature barrel exports
export { default as LoginPage } from '@/pages/Login';
export { default as SignupPage } from '@/pages/Signup';
export { default as AuthGuard } from '@/components/AuthGuard';
export { useAuth } from '@/hooks/useAuth';
export { useAuthMutations } from '@/hooks/useAuthMutations';

// Types
export type { 
  SignupFormData as AuthUser,
  SignupFormData as SignInCredentials,
  SignupFormData as SignUpCredentials,
  ValidationErrors,
  SignupState,
  SignupAction
} from '@/types/auth';
