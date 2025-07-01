
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

type UserRole = 'admin' | 'user' | 'super_admin';

export const useUnbanUserMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (userId: string) => {
      return addToQueue('admin', async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: 'user' as UserRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) throw error;

        // Log the admin action
        await supabase.rpc('audit_sensitive_operation', {
          p_action: 'admin_unban_user',
          p_table_name: 'profiles',
          p_record_id: userId,
          p_new_values: { 
            status: 'active',
            unbanned_at: new Date().toISOString()
          }
        });

        return userId;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('User unbanned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unban user');
    }
  });
};
