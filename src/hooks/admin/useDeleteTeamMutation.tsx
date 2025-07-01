
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../useMutationQueue';

export const useDeleteTeamMutation = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (teamId: string) => {
      return addToQueue('admin', async () => {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);

        if (error) throw error;

        // Log the admin action
        await supabase.rpc('audit_sensitive_operation', {
          p_action: 'admin_delete_team',
          p_table_name: 'teams',
          p_record_id: teamId,
          p_new_values: { deleted_at: new Date().toISOString() }
        });

        return teamId;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete team');
    }
  });
};
