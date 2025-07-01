
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../../useMutationQueue';

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { teamId: string; memberId: string; newRole: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('manage-team-member', {
          body: {
            action: 'update_role',
            team_id: data.teamId,
            member_id: data.memberId,
            new_role: data.newRole
          }
        });

        if (error) throw error;
        return result;
      }, {
        priority: 'normal',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    }
  });
};
