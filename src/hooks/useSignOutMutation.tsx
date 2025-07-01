
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
        // Step 1: Check current session before logout
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[Logout] Current session exists:', !!currentSession);
        
        if (!currentSession) {
          console.log('[Logout] No active session found, performing local cleanup only');
          // Still perform local cleanup even if no session
        } else {
          // Step 2: Log the logout attempt
          try {
            await logSecurityEvent('signout_attempt', {});
          } catch (logError) {
            console.warn('[Logout] Failed to log security event:', logError);
          }
        }
        
        // Step 3: Clear React Query cache immediately to prevent stale data
        console.log('[Logout] Clearing React Query cache...');
        queryClient.clear();
        queryClient.invalidateQueries();
        queryClient.removeQueries();
        
        // Step 4: Sign out from Supabase with timeout (only if session exists)
        if (currentSession) {
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
            try {
              await logSecurityEvent('signout_failed', { error: 'timeout' });
            } catch (logError) {
              console.warn('[Logout] Failed to log timeout error:', logError);
            }
            
            // Don't throw error - continue with local cleanup
            console.warn('[Logout] Continuing with local cleanup despite timeout');
            signOutResult = { error: null };
          }
          
          if (signOutResult.error) {
            console.error('[Logout] Supabase signout failed:', signOutResult.error);
            try {
              await logSecurityEvent('signout_failed', { error: signOutResult.error.message });
            } catch (logError) {
              console.warn('[Logout] Failed to log signout error:', logError);
            }
            
            // Don't throw error - continue with local cleanup
            console.warn('[Logout] Continuing with local cleanup despite Supabase error');
          } else {
            console.log('[Logout] Supabase signout successful');
          }
        }
        
        // Step 5: Comprehensive local storage cleanup
        console.log('[Logout] Clearing local storage...');
        
        // Clear session storage completely
        try {
          sessionStorage.clear();
          console.log('[Logout] Session storage cleared');
        } catch (storageError) {
          console.warn('[Logout] Failed to clear session storage:', storageError);
        }
        
        // Clear specific Supabase keys from localStorage
        try {
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
          console.log('[Logout] Local storage cleanup completed');
        } catch (storageError) {
          console.warn('[Logout] Failed to clear local storage:', storageError);
        }
        
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
        try {
          const { data: { session: postLogoutSession } } = await supabase.auth.getSession();
          if (postLogoutSession) {
            console.warn('[Logout] Session still exists after logout, forcing additional cleanup');
            // Force additional cleanup
            try {
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              console.log('[Logout] Cookie cleanup completed');
            } catch (cookieError) {
              console.warn('[Logout] Cookie cleanup failed:', cookieError);
            }
          } else {
            console.log('[Logout] Session successfully cleared');
          }
        } catch (verifyError) {
          console.warn('[Logout] Failed to verify session clearance:', verifyError);
        }
        
        // Step 8: Log successful logout
        try {
          await logSecurityEvent('signout_success', {});
        } catch (logError) {
          console.warn('[Logout] Failed to log success event:', logError);
        }
        
        console.log('[Logout] Enhanced logout process completed successfully');
        
      } catch (error) {
        console.error('[Logout] Error during logout process:', error);
        
        try {
          await logSecurityEvent('signout_failed', { error: error.message });
        } catch (logError) {
          console.warn('[Logout] Failed to log error event:', logError);
        }
        
        // Even on error, ensure local cleanup
        console.log('[Logout] Performing emergency cleanup...');
        try {
          queryClient.clear();
          sessionStorage.clear();
          
          // Clear localStorage more aggressively
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) keysToRemove.push(key);
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          console.log('[Logout] Emergency cleanup completed');
        } catch (cleanupError) {
          console.error('[Logout] Emergency cleanup failed:', cleanupError);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[Logout] Success callback executing...');
      toast.success('Signed out successfully');
      
      // Force navigation with replace to prevent back button issues
      setTimeout(() => {
        console.log('[Logout] Redirecting to home page...');
        window.location.replace('/');
      }, 100);
    },
    onError: (error: any) => {
      console.error('[Logout] Error callback executing with error:', error);
      
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
        console.log('[Logout] Force redirecting after error...');
        window.location.replace('/');
      }, 1500);
    },
  });
};
