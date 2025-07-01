
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

export const useResetUserCreditsMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (userId: string) => {
      return addToQueue('admin', async () => {
        const { data, error } = await supabase.functions.invoke('reset-user-credits', {
          body: { userId }
        });

        if (error) throw error;
        return data;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
        }
      });
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Credits reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset credits');
    }
  });
};
