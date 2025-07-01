
import { useSignUpMutation } from './useSignUpMutation';
import { useSignInMutation } from './useSignInMutation';
import { useSignOutMutation } from './useSignOutMutation';
import { useResendConfirmationMutation } from './useResendConfirmationMutation';

export const useAuthMutations = () => {
  const signUpMutation = useSignUpMutation();
  const signInMutation = useSignInMutation();
  const signOutMutation = useSignOutMutation();
  const resendConfirmationMutation = useResendConfirmationMutation();

  return {
    signUp: signUpMutation,
    signIn: signInMutation,
    signOut: signOutMutation,
    resendConfirmation: resendConfirmationMutation,
    
    // Consolidated state for better UX
    isLoading: signUpMutation.isPending || 
               signInMutation.isPending || 
               signOutMutation.isPending || 
               resendConfirmationMutation.isPending,
    
    // Reset all mutations
    reset: () => {
      signUpMutation.reset();
      signInMutation.reset();
      signOutMutation.reset();
      resendConfirmationMutation.reset();
    }
  };
};
