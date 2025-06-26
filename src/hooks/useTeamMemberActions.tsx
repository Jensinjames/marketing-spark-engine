
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTeamMemberActions = (teamId: string) => {
  const queryClient = useQueryClient();

  const updateRole = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: {
          action: 'update_role',
          team_id: teamId,
          member_id: memberId,
          new_role: newRole
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-credits', teamId] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update member role');
    }
  });

  const updateCredits = useMutation({
    mutationFn: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: {
          action: 'update_credits',
          team_id: teamId,
          member_id: memberId,
          credits_limit: creditsLimit
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-credits', teamId] });
      toast.success('Member credits updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating credits:', error);
      toast.error(error.message || 'Failed to update member credits');
    }
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: {
          action: 'remove_member',
          team_id: teamId,
          member_id: memberId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-credits', teamId] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  });

  return {
    updateRole,
    updateCredits,
    removeMember
  };
};
