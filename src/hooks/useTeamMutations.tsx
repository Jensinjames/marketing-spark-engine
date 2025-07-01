
import { useCreateTeam } from './team/mutations/useCreateTeam';
import { useUpdateTeam } from './team/mutations/useUpdateTeam';
import { useDeleteTeam } from './team/mutations/useDeleteTeam';
import { useInviteMembers } from './team/mutations/useInviteMembers';
import { useUpdateMemberRole } from './team/mutations/useUpdateMemberRole';
import { useRemoveMember } from './team/mutations/useRemoveMember';
import { useTransferOwnership } from './team/mutations/useTransferOwnership';

export const useTeamMutations = () => {
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const inviteMembers = useInviteMembers();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();

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
