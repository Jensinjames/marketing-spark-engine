
import { useUpdateUserCreditsMutation } from './admin/useUpdateUserCreditsMutation';
import { useResetUserCreditsMutation } from './admin/useResetUserCreditsMutation';
import { useDeleteTeamMutation } from './admin/useDeleteTeamMutation';
import { useBanUserMutation } from './admin/useBanUserMutation';
import { useUnbanUserMutation } from './admin/useUnbanUserMutation';
import { useUpdateUserRoleMutation } from './admin/useUpdateUserRoleMutation';

// Define the allowed role types based on the database enum
export type UserRole = 'admin' | 'user' | 'super_admin';

export const useAdminMutations = () => {
  const updateUserCredits = useUpdateUserCreditsMutation();
  const resetUserCredits = useResetUserCreditsMutation();
  const deleteTeam = useDeleteTeamMutation();
  const banUser = useBanUserMutation();
  const unbanUser = useUnbanUserMutation();
  const updateUserRole = useUpdateUserRoleMutation();

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
