
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMutationQueue } from '../useMutationQueue';

export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      // Optimistic update
      queryClient.setQueryData(['user-content'], (oldData: any) => {
        if (!oldData) return [];
        return oldData.map((item: any) => 
          item.id === id ? { ...item, is_favorite } : item
        );
      });

      return addToQueue('content', async () => {
        const { data: result, error } = await supabase
          .from('generated_content')
          .update({ is_favorite })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'low',
        onError: () => {
          // Rollback optimistic update
          queryClient.setQueryData(['user-content'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((item: any) => 
              item.id === id ? { ...item, is_favorite: !is_favorite } : item
            );
          });
        }
      });
    }
  });
};
