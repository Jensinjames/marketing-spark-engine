
import { useUpdateMemberRole } from './team/mutations/useUpdateMemberRole';
import { useRemoveMember } from './team/mutations/useRemoveMember';

export const useTeamMemberActions = (teamId: string) => {
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  const updateRole = {
    mutate: ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      updateRoleMutation.mutate({ teamId, memberId, newRole });
    },
    mutateAsync: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      return updateRoleMutation.mutateAsync({ teamId, memberId, newRole });
    },
    isPending: updateRoleMutation.isPending
  };

  const updateCredits = {
    mutate: ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // TODO: Implement credits update functionality
      console.log('Update member credits:', { memberId, creditsLimit });
    },
    mutateAsync: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // TODO: Implement credits update functionality
      console.log('Update member credits:', { memberId, creditsLimit });
      return Promise.resolve();
    },
    isPending: false
  };

  const removeMember = {
    mutate: (memberId: string) => {
      removeMemberMutation.mutate({ teamId, memberId });
    },
    mutateAsync: async (memberId: string) => {
      return removeMemberMutation.mutateAsync({ teamId, memberId });
    },
    isPending: removeMemberMutation.isPending
  };

  return {
    updateRole,
    updateCredits,
    removeMember,
    isLoading: updateRoleMutation.isPending || removeMemberMutation.isPending
  };
};
