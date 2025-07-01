
// Comprehensive type definitions for team management
export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: TeamRole;
  status: MemberStatus;
  created_at: string;
  joined_at?: string;
}

export interface TeamMemberWithCredits extends TeamMember {
  credits: {
    monthly_limit: number;
    credits_used: number;
    credits_remaining: number;
    reset_at: string;
  };
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamStatistics {
  total_members: number;
  active_members: number;
  pending_invites: number;
  total_credits_used: number;
  total_credits_available: number;
  credits_utilization: string;
}

export interface TeamAdminData {
  team: Team;
  members: TeamMemberWithCredits[];
  statistics: TeamStatistics;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type MemberStatus = 'active' | 'pending' | 'inactive';

// Error types for better error handling
export interface TeamError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MemberUpdateParams {
  memberId: string;
  newRole?: TeamRole;
  creditsLimit?: number;
}

export interface BulkActionParams {
  memberIds: string[];
  action: 'update_role' | 'update_credits' | 'remove_members';
  newRole?: TeamRole;
  creditsLimit?: number;
}
