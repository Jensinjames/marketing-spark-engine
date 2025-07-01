
import { ReactNode } from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminSecurityWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const AdminSecurityWrapper = ({ 
  children, 
  title = "Admin Access Required",
  description = "This section requires administrative privileges."
}: AdminSecurityWrapperProps) => {
  const { user, isAdminValid, isValidatingAdmin } = useEnhancedAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Authentication Required</span>
          </CardTitle>
          <CardDescription>Please sign in to access this area.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isValidatingAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 animate-pulse" />
            <span>Validating Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdminValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have the required permissions to access this area. 
              Contact your administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
