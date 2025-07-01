
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[SignOut] Starting logout process...');
      
      try {
        // Step 1: Check if we have a session to sign out
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('[SignOut] No active session found, performing local cleanup only');
          // Perform local cleanup even without session
          queryClient.clear();
          sessionStorage.clear();
          return;
        }
        
        console.log('[SignOut] Active session found, signing out...');
        
        // Step 2: Sign out from Supabase with timeout
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Signout timeout')), 3000)
        );
        
        try {
          const { error } = await Promise.race([signOutPromise, timeoutPromise]);
          
          if (error) {
            console.error('[SignOut] Supabase signout failed:', error);
            throw error;
          }
          
          console.log('[SignOut] Supabase signout successful');
        } catch (timeoutError) {
          console.error('[SignOut] Signout timeout or error:', timeoutError);
          // Continue with local cleanup even if signout fails
        }
        
        // Step 3: Local cleanup (always perform this)
        console.log('[SignOut] Performing local cleanup...');
        queryClient.clear();
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
        
        console.log('[SignOut] Logout process completed successfully');
        
      } catch (error) {
        console.error('[SignOut] Error during logout process:', error);
        
        // Emergency cleanup on error
        try {
          queryClient.clear();
          sessionStorage.clear();
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
      }, 300);
    },
    onError: (error: any) => {
      console.error('[SignOut] Error callback executing with error:', error);
      
      toast.error('You have been signed out');
      
      // Force navigation even on error
      setTimeout(() => {
        console.log('[SignOut] Force redirecting after error...');
        window.location.replace('/');
      }, 500);
    },
  });
};
