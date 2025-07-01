
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

export interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showConfirmation?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Forward ref component for the button content
const LogoutButtonContent = React.forwardRef<HTMLButtonElement, LogoutButtonProps>(
  ({ variant = 'ghost', size = 'default', className = '', children, signOut, ...props }, ref) => {
    console.log('[LogoutButtonContent] Rendering button, isPending:', signOut?.isPending);
    
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={signOut?.isPending}
        className={className}
        {...props}
      >
        {signOut?.isPending ? (
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
  }
);

LogoutButtonContent.displayName = 'LogoutButtonContent';

export const LogoutButton = ({ 
  variant = 'ghost', 
  size = 'default', 
  showConfirmation = false,
  className = '',
  children,
  ...props 
}: LogoutButtonProps) => {
  const { signOut } = useAuthMutations();

  const handleLogout = async () => {
    console.log('[LogoutButton] Direct logout initiated');
    
    try {
      await signOut.mutateAsync();
      console.log('[LogoutButton] Direct logout completed successfully');
    } catch (error) {
      console.error('[LogoutButton] Direct logout failed:', error);
      // The mutation already handles error display, so we don't need to show another toast
    }
  };

  const handleConfirmedLogout = async () => {
    console.log('[LogoutButton] Confirmed logout initiated');
    
    try {
      await signOut.mutateAsync();
      console.log('[LogoutButton] Confirmed logout completed successfully');
    } catch (error) {
      console.error('[LogoutButton] Confirmed logout failed:', error);
      // The mutation already handles error display
    }
  };

  // For non-confirmation mode, use the button directly
  if (!showConfirmation) {
    console.log('[LogoutButton] Rendering direct logout button');
    return (
      <LogoutButtonContent
        variant={variant}
        size={size}
        className={className}
        signOut={signOut}
        onClick={handleLogout}
        {...props}
      >
        {children}
      </LogoutButtonContent>
    );
  }

  // For confirmation mode, wrap with AlertDialog
  console.log('[LogoutButton] Rendering confirmation logout button');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <LogoutButtonContent
          variant={variant}
          size={size}
          className={className}
          signOut={signOut}
          {...props}
        >
          {children}
        </LogoutButtonContent>
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
            onClick={handleConfirmedLogout}
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
};

export default LogoutButton;
