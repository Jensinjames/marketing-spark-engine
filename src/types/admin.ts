
// Admin-specific type definitions
export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
  status: UserStatus;
}

export interface UserCredits {
  user_id: string;
  monthly_limit: number;
  credits_used: number;
  reset_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    role?: UserRole;
  };
}

export interface AdminTeam {
  id: string;
  name: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  team_members: TeamMember[];
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'user';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface AdminMutationParams {
  userId: string;
  newMonthlyLimit?: number;
  newRole?: UserRole;
}

export interface TeamDeleteParams {
  teamId: string;
}
