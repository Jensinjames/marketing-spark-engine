
// Shared type definitions
export type { AdminUser, UserCredits, AdminTeam, UserRole, UserStatus } from '@/types/admin';
export type { TeamMember, TeamMemberWithCredits, TeamAdminData, Team } from '@/types/team';
export type { SignupFormData, ValidationErrors, SignupState, SignupAction } from '@/types/auth';

// Common utility types
export type Maybe<T> = T | null;
export type Optional<T> = T | undefined;
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
