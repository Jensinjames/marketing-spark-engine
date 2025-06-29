import React from 'react';
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
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export const LogoutButton = ({ 
  variant = 'ghost', 
  size = 'default', 
  showConfirmation = false,
  className = '',
  children,
  ...props 
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showConfirmation?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) => {
  const { signOut } = useAuthMutations();

  const handleLogout = async () => {
    console.log('[LogoutButton] Logout initiated');
    try {
      await signOut.mutateAsync();
      console.log('[LogoutButton] Logout completed successfully');
    } catch (error) {
      console.error('[LogoutButton] Logout failed:', error);
    }
  };

  const LogoutButtonContent = () => (
    <Button
      variant={variant}
      size={size}
      onClick={showConfirmation ? undefined : handleLogout}
      disabled={signOut.isPending}
      className={className}
      {...props}
    >
      {signOut.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          {children || 'Logout'}
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
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              disabled={signOut.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {signOut.isPending ? (
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

export default LogoutButton