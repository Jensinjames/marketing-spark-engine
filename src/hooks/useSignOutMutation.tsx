
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSecurityEvent } from '@/utils/authLogging';

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[Logout] Starting logout process...');
      await logSecurityEvent('signout_attempt', {});
      
      // Clear all React Query cache immediately to prevent stale data
      queryClient.clear();
      console.log('[Logout] Query cache cleared');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Logout] Supabase signout failed:', error);
        await logSecurityEvent('signout_failed', { error: error.message });
        throw error;
      }
      
      console.log('[Logout] Supabase signout successful');
      
      // Clear session storage and local storage to remove any cached auth data
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      await logSecurityEvent('signout_success', {});
      console.log('[Logout] Logout process completed successfully');
    },
    onSuccess: () => {
      console.log('[Logout] Success callback executing...');
      toast.success('Signed out successfully');
      
      // Force navigation to home page
      window.location.href = '/';
    },
    onError: (error: any) => {
      console.error('[Logout] Error during logout:', error);
      toast.error('Error signing out. Please try again.');
      
      // Even if there's an error, try to navigate home as a fallback
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
  });
};
