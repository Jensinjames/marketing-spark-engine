
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

type UserRole = 'admin' | 'user' | 'super_admin';

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { userId: string; newRole: UserRole }) => {
      return addToQueue('admin', async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: data.newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.userId);

        if (error) throw error;

        // Log the admin action
        await supabase.rpc('audit_sensitive_operation', {
          p_action: 'admin_update_user_role',
          p_table_name: 'profiles',
          p_record_id: data.userId,
          p_new_values: { 
            role: data.newRole,
            role_updated_at: new Date().toISOString()
          }
        });

        return data;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });
};
