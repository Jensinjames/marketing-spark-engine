import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuthMutations } from '@/hooks/useAuthMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showConfirmation?: boolean;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'ghost',
  size = 'default',
  showConfirmation = false,
  className = ''
}) => {
  const { signOut } = useAuthMutations();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    console.log('[LogoutButton] Logout initiated by user');
    setIsLoggingOut(true);
    
    try {
      await signOut.mutateAsync();
      console.log('[LogoutButton] Logout completed successfully');
    } catch (error) {
      console.error('[LogoutButton] Logout failed:', error);
      // The mutation handles error display and navigation
    } finally {
      setIsLoggingOut(false);
    }
  };

  const LogoutButtonContent = () => (
    <Button
      variant={variant}
      size={size}
      onClick={showConfirmation ? undefined : handleLogout}
      disabled={isLoggingOut || signOut.isPending}
      className={`${className} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
      aria-label="Sign out of your account"
    >
      {isLoggingOut || signOut.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
          Sign Out
        </>
      )}
    </Button>
  );

  if (showConfirmation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <LogoutButtonContent />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut || signOut.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isLoggingOut || signOut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return <LogoutButtonContent />;
};

export default LogoutButton;