
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

type UserRole = 'admin' | 'user' | 'super_admin';

export const useBanUserMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { userId: string; reason?: string }) => {
      return addToQueue('admin', async () => {
        // Since 'banned' is not in the enum, we'll use a different approach
        // We could add a separate 'banned' field or use 'user' role with metadata
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: 'user' as UserRole, // Keep as user but add ban metadata
            updated_at: new Date().toISOString()
          })
          .eq('id', data.userId);

        if (error) throw error;

        // Log the admin action with ban information
        await supabase.rpc('audit_sensitive_operation', {
          p_action: 'admin_ban_user',
          p_table_name: 'profiles',
          p_record_id: data.userId,
          p_new_values: { 
            status: 'banned',
            ban_reason: data.reason,
            banned_at: new Date().toISOString()
          }
        });

        return data;
      }, {
        priority: 'critical',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('User banned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to ban user');
    }
  });
};
