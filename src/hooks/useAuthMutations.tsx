
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
  };
};
