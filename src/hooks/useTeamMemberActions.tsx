
import { useTeamMutations } from './useTeamMutations';

export const useTeamMemberActions = (teamId: string) => {
  const { updateMemberRole, removeMember, isLoading } = useTeamMutations();

  const updateRole = {
    mutate: ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      updateMemberRole.mutate({ teamId, memberId, newRole });
    },
    isPending: updateMemberRole.isPending
  };

  const updateCredits = {
    mutate: ({ memberId, creditsLimit }: { memberId: string; creditsLimit: number }) => {
      // This functionality can be moved to admin mutations if needed
      console.log('Update member credits:', { memberId, creditsLimit });
    },
    isPending: false
  };

  const removeMemberAction = {
    mutate: (memberId: string) => {
      removeMember.mutate({ teamId, memberId });
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
