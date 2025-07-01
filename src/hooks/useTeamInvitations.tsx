import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateTeamInvitation, type SendTeamInvitationInput } from '@/utils/apiValidation';

interface SendInvitationResponse {
  success: boolean;
  sent: Array<{
    email: string;
    status: string;
    invitation_id: string;
    expires_at: string;
  }>;
  errors?: Array<{
    email: string;
    error: string;
  }>;
  unsubscribed_emails?: string[];
}

export const useSendTeamInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendTeamInvitationInput): Promise<SendInvitationResponse> => {
      // Validate input data
      const validatedData = validateTeamInvitation(data);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to send invitations');
      }

      // Call the Edge Function
      const { data: result, error } = await supabase.functions.invoke('send-team-invitation', {
        body: validatedData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send invitations');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitations');
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      
      // Show success messages
      if (result.sent && result.sent.length > 0) {
        const count = result.sent.length;
        toast.success(`Successfully sent ${count} invitation${count > 1 ? 's' : ''}`);
      }

      // Show warnings for errors
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          toast.error(`Failed to invite ${error.email}: ${error.error}`, {
            duration: 5000
          });
        });
      }

      // Show warnings for unsubscribed emails
      if (result.unsubscribed_emails && result.unsubscribed_emails.length > 0) {
        const count = result.unsubscribed_emails.length;
        toast.warning(
          `${count} email${count > 1 ? 's have' : ' has'} previously unsubscribed: ${result.unsubscribed_emails.join(', ')}`,
          { duration: 7000 }
        );
      }
    },
    onError: (error: any) => {
      console.error('Send invitation error:', error);
      
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        toast.error('Too many invitations sent. Please wait before sending more.', {
          duration: 5000
        });
      } else if (error.message.includes('Validation failed')) {
        toast.error('Please check your input and try again.');
      } else if (error.message.includes('Forbidden')) {
        toast.error('You do not have permission to send invitations for this team.');
      } else if (error.message.includes('Email service not configured')) {
        toast.error('Email service is not properly configured. Please contact support.');
      } else {
        toast.error(error.message || 'Failed to send invitations. Please try again.');
      }
    },
  });
};

// Hook for resending failed invitations
export const useResendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to resend invitations');
      }

      // Get invitation details first
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .select('email, team_id, role')
        .eq('id', invitationId)
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Use the send invitation endpoint with single email
      const { data: result, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          team_id: invitation.team_id,
          emails: [invitation.email],
          role: invitation.role
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to resend invitation');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['email-delivery-logs'] });
      toast.success('Invitation resent successfully');
    },
    onError: (error: any) => {
      console.error('Resend invitation error:', error);
      toast.error(error.message || 'Failed to resend invitation');
    },
  });
};

// Hook for canceling invitations
export const useCancelInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        throw new Error(error.message || 'Failed to cancel invitation');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      toast.success('Invitation cancelled successfully');
    },
    onError: (error: any) => {
      console.error('Cancel invitation error:', error);
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });
};

// Hook for getting team invitations with delivery status
export const useTeamInvitations = (teamId: string) => {
  return useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          profiles:invited_by(email, raw_user_meta_data),
          email_delivery_logs(
            status,
            retry_count,
            provider_message_id,
            created_at,
            updated_at,
            error_message
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!teamId,
  });
};

// Hook for getting email delivery statistics
export const useEmailDeliveryStats = (teamId?: string) => {
  return useQuery({
    queryKey: ['email-delivery-stats', teamId],
    queryFn: async () => {
      let query = supabase
        .from('email_delivery_logs')
        .select(`
          status,
          created_at,
          team_invitations!inner(team_id)
        `);

      if (teamId) {
        query = query.eq('team_invitations.team_id', teamId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Aggregate stats
      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        delivered: data.filter(log => log.status === 'delivered').length,
        failed: data.filter(log => log.status === 'failed').length,
        bounced: data.filter(log => log.status === 'bounced').length,
        pending: data.filter(log => log.status === 'queued').length,
      };

      stats.success_rate = stats.total > 0 ? ((stats.sent + stats.delivered) / stats.total) * 100 : 0;

      return {
        stats,
        recent_logs: data.slice(0, 10) // Return 10 most recent logs
      };
    },
  });
};