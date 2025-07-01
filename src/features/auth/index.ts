
// Auth feature barrel exports
export { default as LoginPage } from '@/pages/Login';
export { default as SignupPage } from '@/pages/Signup';
export { AuthGuard } from '@/components/AuthGuard';
export { useAuth } from '@/hooks/useAuth';
export { useAuthMutations } from '@/hooks/useAuthMutations';

// Types
export type { AuthUser, SignInCredentials, SignUpCredentials } from '@/types/auth';
