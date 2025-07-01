
import { useTeamMutations } from './useTeamMutations';

export const useTeamMemberActions = (teamId: string) => {
  const { updateMemberRole, removeMember, isLoading } = useTeamMutations();

  // Return the actual mutation objects so components can use mutateAsync
  const updateRole = {
    mutate: ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      updateMemberRole.mutate({ teamId, memberId, newRole });
    },
    mutateAsync: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      return updateMemberRole.mutateAsync({ teamId, memberId, newRole });
    },
    isPending: updateMemberRole.isPending
  };

  const updateCredits = {
    mutate: ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // This functionality can be moved to admin mutations if needed
      console.log('Update member credits:', { memberId, creditsLimit });
    },
    mutateAsync: async ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // This functionality can be moved to admin mutations if needed
      console.log('Update member credits:', { memberId, creditsLimit });
      return Promise.resolve();
    },
    isPending: false
  };

  const removeMemberAction = {
    mutate: (memberId: string) => {
      removeMember.mutate({ teamId, memberId });
    },
    mutateAsync: async (memberId: string) => {
      return removeMember.mutateAsync({ teamId, memberId });
    },
    isPending: removeMember.isPending
  };

  return {
    updateRole,
    updateCredits,
    removeMember: removeMemberAction,
    isLoading
  };
};
