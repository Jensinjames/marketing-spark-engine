
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../../useMutationQueue';

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('create-team', {
          body: {
            name: data.name,
            description: data.description
          }
        });

        if (error) throw error;
        
        if (!result.success) {
          const errorMessage = result.upgrade_required 
            ? `${result.error}. Upgrade your plan to create more teams.`
            : result.error;
          throw new Error(errorMessage);
        }
        
        return result.team;
      }, {
        priority: 'normal',
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
          queryClient.setQueryData(['user-teams'], (oldData: any) => {
            if (!oldData) return [result];
            return [...oldData, result];
          });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create team');
    }
  });
};
