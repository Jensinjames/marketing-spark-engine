
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutationQueue } from './useMutationQueue';

export const useTeamMutations = () => {
  const queryClient = useQueryClient();
  const { addToQueue } = useMutationQueue();

  const createTeam = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase
          .from('teams')
          .insert({
            name: data.name,
            description: data.description,
            owner_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'normal',
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
          queryClient.setQueryData(['user-teams'], (oldData: any) => {
            if (!oldData) return [result];
            return [...oldData, result];
          });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create team');
    }
  });

  const updateTeam = useMutation({
    mutationFn: async (data: { id: string; name?: string; description?: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase
          .from('teams')
          .update({
            name: data.name,
            description: data.description,
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
          queryClient.setQueryData(['user-teams'], (oldData: any) => {
            if (!oldData) return [result];
            return oldData.map((team: any) => 
              team.id === result.id ? result : team
            );
          });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update team');
    }
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      return addToQueue('team', async () => {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);

        if (error) throw error;
        return teamId;
      }, {
        priority: 'high',
        onSuccess: (deletedId) => {
          queryClient.setQueryData(['user-teams'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.filter((team: any) => team.id !== deletedId);
          });
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
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

  const inviteMembers = useMutation({
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

  const updateMemberRole = useMutation({
    mutationFn: async (data: { teamId: string; memberId: string; newRole: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('manage-team-member', {
          body: {
            action: 'update_role',
            team_id: data.teamId,
            member_id: data.memberId,
            new_role: data.newRole
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
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    }
  });

  const removeMember = useMutation({
    mutationFn: async (data: { teamId: string; memberId: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase.functions.invoke('manage-team-member', {
          body: {
            action: 'remove_member',
            team_id: data.teamId,
            member_id: data.memberId
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
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    }
  });

  const transferOwnership = useMutation({
    mutationFn: async (data: { teamId: string; newOwnerId: string }) => {
      return addToQueue('team', async () => {
        const { data: result, error } = await supabase
          .from('teams')
          .update({ owner_id: data.newOwnerId })
          .eq('id', data.teamId)
          .select()
          .single();

        if (error) throw error;
        return result;
      }, {
        priority: 'high',
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['user-teams'] });
          queryClient.invalidateQueries({ queryKey: ['team-members', data.teamId] });
        }
      });
    },
    onSuccess: () => {
      toast.success('Team ownership transferred successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to transfer ownership');
    }
  });

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMembers,
    updateMemberRole,
    removeMember,
    transferOwnership,
    
    // Consolidated state
    isLoading: createTeam.isPending || 
               updateTeam.isPending || 
               deleteTeam.isPending || 
               inviteMembers.isPending || 
               updateMemberRole.isPending || 
               removeMember.isPending || 
               transferOwnership.isPending,
    
    // Reset all mutations
    reset: () => {
      createTeam.reset();
      updateTeam.reset();
      deleteTeam.reset();
      inviteMembers.reset();
      updateMemberRole.reset();
      removeMember.reset();
      transferOwnership.reset();
    }
  };
};
