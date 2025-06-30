
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSecurityEvent } from '@/utils/authLogging';

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[Logout] Starting enhanced logout process...');
      
      try {
        // Step 1: Log the logout attempt
        await logSecurityEvent('signout_attempt', {});
        
        // Step 2: Clear React Query cache immediately to prevent stale data
        console.log('[Logout] Clearing React Query cache...');
        queryClient.clear();
        queryClient.invalidateQueries();
        queryClient.removeQueries();
        
        // Step 3: Check current session before logout
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[Logout] Current session exists:', !!currentSession);
        
        // Step 4: Sign out from Supabase with timeout
        console.log('[Logout] Calling Supabase signOut...');
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<{ error: Error }>((_, reject) => 
          setTimeout(() => reject(new Error('Signout timeout after 10 seconds')), 10000)
        );
        
        let signOutResult;
        try {
          signOutResult = await Promise.race([signOutPromise, timeoutPromise]);
        } catch (timeoutError) {
          console.error('[Logout] Supabase signout timeout:', timeoutError);
          await logSecurityEvent('signout_failed', { error: 'timeout' });
          
          // Don't throw error - continue with local cleanup
          console.warn('[Logout] Continuing with local cleanup despite timeout');
          signOutResult = { error: null };
        }
        
        if (signOutResult.error) {
          console.error('[Logout] Supabase signout failed:', signOutResult.error);
          await logSecurityEvent('signout_failed', { error: signOutResult.error.message });
          
          // Don't throw error - continue with local cleanup
          console.warn('[Logout] Continuing with local cleanup despite Supabase error');
        } else {
          console.log('[Logout] Supabase signout successful');
        }
        
        // Step 5: Comprehensive local storage cleanup
        console.log('[Logout] Clearing local storage...');
        
        // Clear session storage completely
        sessionStorage.clear();
        
        // Clear specific Supabase keys from localStorage
        const supabaseKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('supabase')) {
            supabaseKeys.push(key);
          }
        }
        supabaseKeys.forEach(key => {
          console.log(`[Logout] Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        });
        
        // Step 6: Clear any service worker cache
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            console.log('[Logout] Service worker cache cleared');
          } catch (swError) {
            console.warn('[Logout] Service worker cleanup failed:', swError);
          }
        }
        
        // Step 7: Verify session is actually cleared
        const { data: { session: postLogoutSession } } = await supabase.auth.getSession();
        if (postLogoutSession) {
          console.warn('[Logout] Session still exists after logout, forcing local clear');
          // Force additional cleanup
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        } else {
          console.log('[Logout] Session successfully cleared');
        }
        
        await logSecurityEvent('signout_success', {});
        console.log('[Logout] Enhanced logout process completed successfully');
        
      } catch (error) {
        console.error('[Logout] Error during logout process:', error);
        await logSecurityEvent('signout_failed', { error: error.message });
        
        // Even on error, ensure local cleanup
        queryClient.clear();
        sessionStorage.clear();
        localStorage.clear();
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[Logout] Success callback executing...');
      toast.success('Signed out successfully');
      
      // Force navigation with replace to prevent back button issues
      window.location.replace('/');
    },
    onError: (error: any) => {
      console.error('[Logout] Error during logout:', error);
      
      // Show appropriate error message
      if (error.message?.includes('timeout')) {
        toast.error('Logout is taking longer than expected. You have been signed out locally.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error during logout. You have been signed out locally.');
      } else {
        toast.error('Error signing out. You have been signed out locally.');
      }
      
      // Force navigation even on error with a slight delay
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    },
  });
};
