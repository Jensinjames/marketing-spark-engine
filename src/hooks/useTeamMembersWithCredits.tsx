
import { TeamMemberWithCredits, TeamAdminData } from '@/types/team';
import { useOptimizedTeamMembers } from './useOptimizedTeamMembers';

// Re-export types for backward compatibility
export type { TeamMemberWithCredits, TeamAdminData };

export const useTeamMembersWithCredits = (teamId: string | null) => {
  return useOptimizedTeamMembers(teamId);
};
