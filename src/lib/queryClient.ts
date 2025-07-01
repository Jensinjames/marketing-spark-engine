
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes instead of 5
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
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
        return failureCount < 2; // Reduced from 3 to 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Add query deduplication
      refetchOnMount: 'always',
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

// Handle session expiry by signing out and redirecting to login
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
