
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSecurityEvent } from '@/utils/authLogging';

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[SignOut] Starting logout process...');
      
      try {
        // Step 1: Check current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[SignOut] Current session exists:', !!currentSession);
        
        // Step 2: Log the logout attempt (if session exists)
        if (currentSession) {
          try {
            await logSecurityEvent('signout_attempt', {});
          } catch (logError) {
            console.warn('[SignOut] Failed to log security event:', logError);
          }
        }
        
        // Step 3: Clear React Query cache immediately
        console.log('[SignOut] Clearing React Query cache...');
        queryClient.clear();
        queryClient.invalidateQueries();
        queryClient.removeQueries();
        
        // Step 4: Sign out from Supabase (with timeout)
        if (currentSession) {
          console.log('[SignOut] Calling Supabase signOut...');
          
          const signOutPromise = supabase.auth.signOut();
          const timeoutPromise = new Promise<{ error: Error }>((_, reject) => 
            setTimeout(() => reject(new Error('Signout timeout')), 8000)
          );
          
          try {
            const signOutResult = await Promise.race([signOutPromise, timeoutPromise]);
            
            if (signOutResult.error) {
              console.error('[SignOut] Supabase signout failed:', signOutResult.error);
              throw signOutResult.error;
            }
            
            console.log('[SignOut] Supabase signout successful');
          } catch (timeoutError) {
            console.error('[SignOut] Supabase signout timeout or error:', timeoutError);
            // Continue with local cleanup even if signout fails
          }
        }
        
        // Step 5: Local storage cleanup
        console.log('[SignOut] Performing local cleanup...');
        
        try {
          sessionStorage.clear();
          
          // Clear Supabase keys from localStorage
          const supabaseKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('supabase')) {
              supabaseKeys.push(key);
            }
          }
          supabaseKeys.forEach(key => localStorage.removeItem(key));
          
          console.log('[SignOut] Local cleanup completed');
        } catch (storageError) {
          console.warn('[SignOut] Storage cleanup failed:', storageError);
        }
        
        // Step 6: Log successful logout
        try {
          await logSecurityEvent('signout_success', {});
        } catch (logError) {
          console.warn('[SignOut] Failed to log success event:', logError);
        }
        
        console.log('[SignOut] Logout process completed successfully');
        
      } catch (error) {
        console.error('[SignOut] Error during logout process:', error);
        
        // Emergency cleanup on error
        try {
          queryClient.clear();
          sessionStorage.clear();
          localStorage.clear();
          console.log('[SignOut] Emergency cleanup completed');
        } catch (cleanupError) {
          console.error('[SignOut] Emergency cleanup failed:', cleanupError);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[SignOut] Success callback executing...');
      toast.success('Signed out successfully');
      
      // Force navigation after short delay
      setTimeout(() => {
        console.log('[SignOut] Redirecting to home page...');
        window.location.replace('/');
      }, 500);
    },
    onError: (error: any) => {
      console.error('[SignOut] Error callback executing with error:', error);
      
      // Show appropriate error message
      if (error.message?.includes('timeout')) {
        toast.error('Logout is taking longer than expected. You have been signed out locally.');
      } else {
        toast.error('Error signing out. You have been signed out locally.');
      }
      
      // Force navigation even on error
      setTimeout(() => {
        console.log('[SignOut] Force redirecting after error...');
        window.location.replace('/');
      }, 1000);
    },
  });
};
