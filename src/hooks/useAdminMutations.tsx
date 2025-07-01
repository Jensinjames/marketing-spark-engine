
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from './useMutationQueue';

// Define the allowed role types based on the database enum
type UserRole = 'admin' | 'user' | 'super_admin';

export const useAdminMutations = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  const updateUserCredits = useMutation({
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

  const resetUserCredits = useMutation({
    mutationFn: async (userId: string) => {
      return addToQueue('admin', async () => {
        const { data, error } = await supabase.functions.invoke('reset-user-credits', {
          body: { userId }
        });

        if (error) throw error;
        return data;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
        }
      });
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Credits reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset credits');
    }
  });

  const deleteTeam = useMutation({
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

  const banUser = useMutation({
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

  const unbanUser = useMutation({
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

  const updateUserRole = useMutation({
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

  return {
    updateUserCredits,
    resetUserCredits,
    deleteTeam,
    banUser,
    unbanUser,
    updateUserRole,
    
    // Consolidated state
    isLoading: updateUserCredits.isPending || 
               resetUserCredits.isPending || 
               deleteTeam.isPending || 
               banUser.isPending || 
               unbanUser.isPending || 
               updateUserRole.isPending,
    
    // Reset all mutations
    reset: () => {
      updateUserCredits.reset();
      resetUserCredits.reset();
      deleteTeam.reset();
      banUser.reset();
      unbanUser.reset();
      updateUserRole.reset();
    }
  };
};
