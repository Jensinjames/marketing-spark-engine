
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

export const useUpdateUserCreditsMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { userId: string; newMonthlyLimit: number }) => {
      return addToQueue('admin', async () => {
        const { error } = await supabase
          .from('user_credits')
          .update({ monthly_limit: data.newMonthlyLimit })
          .eq('user_id', data.userId);

        if (error) throw error;

        // Log the admin action
        await supabase.rpc('audit_sensitive_operation', {
          p_action: 'admin_update_credit_limit',
          p_table_name: 'user_credits',
          p_record_id: data.userId,
          p_new_values: { 
            monthly_limit: data.newMonthlyLimit, 
            updated_at: new Date().toISOString() 
          }
        });

        return data;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Credit limit updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update credit limit');
    }
  });
};
