
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberWithCredits {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  joined_at?: string;
  credits: {
    monthly_limit: number;
    credits_used: number;
    credits_remaining: number;
    reset_at: string;
  };
}

export interface TeamAdminData {
  team: {
    id: string;
    name: string;
    owner_id: string;
  };
  members: TeamMemberWithCredits[];
  statistics: {
    total_members: number;
    active_members: number;
    pending_invites: number;
    total_credits_used: number;
    total_credits_available: number;
    credits_utilization: string;
  };
}

export const useTeamMembersWithCredits = (teamId: string | null) => {
  return useQuery({
    queryKey: ['team-members-credits', teamId],
    queryFn: async (): Promise<TeamAdminData> => {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be authenticated');
      }

      const { data, error } = await supabase.functions.invoke('get-team-credits-admins', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: new URLSearchParams({ team_id: teamId }),
      });

      if (error) {
        console.error('Error fetching team admin data:', error);
        throw new Error(error.message || 'Failed to fetch team data');
      }

      if (!data) {
        throw new Error('No data returned from server');
      }

      return data as TeamAdminData;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
