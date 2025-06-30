import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Handle invalid refresh token errors
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Session Expired')) {
          handleSessionExpired();
          return false;
        }
        
        // Don't retry on authentication errors
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
        
        // Handle invalid refresh token errors
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Session Expired')) {
          handleSessionExpired();
          return;
        }
        
        const message = error?.message || 'An error occurred';
        if (!message.includes('JWT') && !message.includes('Invalid credentials')) {
          toast.error(message);
        }
      },
    },
  },
});

/**
 * Handles user session expiration by signing out, clearing cached data, notifying the user, and redirecting to the login page.
 *
 * If an error occurs during sign-out, the user is still redirected to the login page.
 */
async function handleSessionExpired() {
  try {
    // Clear the session
    await supabase.auth.signOut();
    
    // Clear any cached data
    queryClient.clear();
    
    // Show a user-friendly message
    toast.error('Your session has expired. Please sign in again.');
    
    // Redirect to login page
    window.location.replace('/login');
  } catch (error) {
    console.error('Error handling session expiry:', error);
    // Force redirect even if signOut fails
    window.location.replace('/login');
  }
}