
import { useCreateTeamMutation } from './team/useCreateTeamMutation';
import { useUpdateTeamMutation } from './team/useUpdateTeamMutation';
import { useDeleteTeamMutation } from './team/useDeleteTeamMutation';
import { useInviteMembersMutation } from './team/useInviteMembersMutation';
import { useUpdateMemberRoleMutation } from './team/useUpdateMemberRoleMutation';
import { useRemoveMemberMutation } from './team/useRemoveMemberMutation';
import { useTransferOwnershipMutation } from './team/useTransferOwnershipMutation';

export const useTeamMutations = () => {
  const createTeam = useCreateTeamMutation();
  const updateTeam = useUpdateTeamMutation();
  const deleteTeam = useDeleteTeamMutation();
  const inviteMembers = useInviteMembersMutation();
  const updateMemberRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();
  const transferOwnership = useTransferOwnershipMutation();

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
