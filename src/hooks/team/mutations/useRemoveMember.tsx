
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../../useMutationQueue';

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { teamId: string; memberId: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('manage-team-member', {
          body: {
            action: 'remove_member',
            team_id: data.teamId,
            member_id: data.memberId
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
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    }
  });
};
