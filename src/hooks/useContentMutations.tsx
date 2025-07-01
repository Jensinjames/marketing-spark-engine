import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from './useMutationQueue';

// Define the allowed content types based on the database enum
type ContentType = 'email_sequence' | 'ad_copy' | 'landing_page' | 'social_post' | 'blog_post' | 'funnel' | 'strategy_brief';

export const useContentMutations = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  const createContent = useMutation({
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

  const updateContent = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      content?: any;
      is_favorite?: boolean;
    }) => {
      return addToQueue('content', async () => {
        const { data: result, error } = await supabase
          .from('generated_content')
          .update({
            title: data.title,
            content: data.content,
            is_favorite: data.is_favorite,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'normal',
        onSuccess: (result) => {
          queryClient.setQueryData(['user-content'], (oldData: any) => {
            if (!oldData) return [result];
            return oldData.map((item: any) => 
              item.id === result.id ? result : item
            );
          });
        }
      });
    },
    onSuccess: () => {
      toast.success('Content updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update content');
    }
  });

  const deleteContent = useMutation({
    mutationFn: async (contentId: string) => {
      return addToQueue('content', async () => {
        const { error } = await supabase
          .from('generated_content')
          .delete()
          .eq('id', contentId);

        if (error) throw error;
        return contentId;
      }, {
        priority: 'normal',
        onSuccess: (deletedId) => {
          queryClient.setQueryData(['user-content'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.filter((item: any) => item.id !== deletedId);
          });
          queryClient.invalidateQueries({ queryKey: ['user-content'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Content deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete content');
    }
  });

  const toggleFavorite = useMutation({
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

  const duplicateContent = useMutation({
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

  return {
    createContent,
    updateContent,
    deleteContent,
    toggleFavorite,
    duplicateContent,
    
    // Consolidated state
    isLoading: createContent.isPending || 
               updateContent.isPending || 
               deleteContent.isPending || 
               toggleFavorite.isPending || 
               duplicateContent.isPending,
    
    // Reset all mutations
    reset: () => {
      createContent.reset();
      updateContent.reset();
      deleteContent.reset();
      toggleFavorite.reset();
      duplicateContent.reset();
    }
  };
};
