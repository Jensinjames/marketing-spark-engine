
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

// Define the allowed content types based on the database enum
type ContentType = 'email_sequence' | 'ad_copy' | 'landing_page' | 'social_post' | 'blog_post' | 'funnel' | 'strategy_brief';

export const useCreateContentMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: {
      type: ContentType;
      title: string;
      content: any;
      prompt?: string;
    }) => {
      return addToQueue('content', async () => {
        const { data: result, error } = await supabase
          .from('generated_content')
          .insert({
            type: data.type,
            title: data.title,
            content: data.content,
            prompt: data.prompt,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'normal',
        onSuccess: (result) => {
          queryClient.setQueryData(['user-content'], (oldData: any) => {
            if (!oldData) return [result];
            return [result, ...oldData];
          });
          queryClient.invalidateQueries({ queryKey: ['user-content'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Content created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create content');
    }
  });
};
