
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

export const useTransferOwnershipMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { teamId: string; newOwnerId: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase
          .from('teams')
          .update({ owner_id: data.newOwnerId })
          .eq('id', data.teamId)
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
          queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team ownership transferred successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to transfer ownership');
    }
  });
};
