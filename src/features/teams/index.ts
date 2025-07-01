
// Teams feature barrel exports
export { default as TeamsPage } from '@/pages/Teams';
export { TeamMembersList } from '@/components/teams/TeamMembersList';
export { TeamAnalytics } from '@/components/teams/TeamAnalytics';
export { useTeamMembersWithCredits } from '@/hooks/useTeamMembersWithCredits';
export { useTeamMutations } from '@/hooks/useTeamMutations';

// Types
export type { 
  TeamMember, 
  TeamMemberWithCredits, 
  TeamAdminData, 
  Team 
} from '@/types/team';
