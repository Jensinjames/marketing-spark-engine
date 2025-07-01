
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../../useMutationQueue';

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (teamId: string) => {
      return addToQueue('team', async () => {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);

        if (error) throw error;
        return teamId;
      }, {
        priority: 'high',
        onSuccess: (deletedId) => {
          queryClient.setQueryData(['user-teams'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.filter((team: any) => team.id !== deletedId);
          });
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete team');
    }
  });
};
