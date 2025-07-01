
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

export const useDuplicateContentMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (contentId: string) => {
      return addToQueue('content', async () => {
        // First get the original content
        const { data: original, error: fetchError } = await supabase
          .from('generated_content')
          .select('*')
          .eq('id', contentId)
          .single();

        if (fetchError) throw fetchError;

        // Create duplicate
        const { data: duplicate, error: createError } = await supabase
          .from('generated_content')
          .insert({
            type: original.type,
            title: `${original.title} (Copy)`,
            content: original.content,
            prompt: original.prompt,
            user_id: original.user_id
          })
          .select()
          .single();

        if (createError) throw createError;
        return duplicate;
      }, {
        priority: 'normal',
        onSuccess: (result) => {
          queryClient.setQueryData(['user-content'], (oldData: any) => {
            if (!oldData) return [result];
            return [result, ...oldData];
          });
        }
      });
    },
    onSuccess: () => {
      toast.success('Content duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate content');
    }
  });
};
