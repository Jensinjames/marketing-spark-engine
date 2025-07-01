
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from '../../useMutationQueue';

export const useInviteMembers = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  return useMutation({
    mutationFn: async (data: { teamId: string; emails: string[]; role: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('invite-team-members', {
          body: {
            team_id: data.teamId,
            emails: data.emails,
            role: data.role
          }
        });

        if (error) throw error;
        return result;
      }, {
        priority: 'normal',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team invitations sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invitations');
    }
  });
};
