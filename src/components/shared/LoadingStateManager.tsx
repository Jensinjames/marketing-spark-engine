
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  offline?: boolean;
  children: React.ReactNode;
  loadingSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export const LoadingStateManager = ({
  loading = false,
  error = null,
  empty = false,
  offline = false,
  children,
  loadingSkeleton,
  emptyState,
  errorState,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: LoadingStateProps) => {
  // Offline state
  if (offline) {
    return (
      <Card className="surface-elevated">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-warning-light rounded-full">
            <WifiOff className="h-6 w-6 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            You're offline
          </h3>
          <p className="text-secondary mb-4">
            Please check your internet connection and try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <Wifi className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    if (errorState) {
      return <>{errorState}</>;
    }

    return (
      <Card className="surface-elevated">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-error-light rounded-full">
            <AlertCircle className="h-6 w-6 text-error" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-secondary mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          {onRetry && retryCount < maxRetries && (
            <Button onClick={onRetry}>
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </Button>
          )}
          {retryCount >= maxRetries && (
            <p className="text-xs text-tertiary">
              Maximum retry attempts reached. Please refresh the page.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    if (loadingSkeleton) {
      return <>{loadingSkeleton}</>;
    }

    return <DefaultLoadingSkeleton />;
  }

  // Empty state
  if (empty) {
    if (emptyState) {
      return <>{emptyState}</>;
    }

    return (
      <Card className="surface-elevated">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No data available
          </h3>
          <p className="text-secondary">
            There's nothing to show here yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

const DefaultLoadingSkeleton = () => (
  <Card className="surface-elevated">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

// Custom hook for managing loading states with retry logic
export const useLoadingState = (initialRetryCount = 0) => {
  const [retryCount, setRetryCount] = React.useState(initialRetryCount);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const incrementRetry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const resetRetry = React.useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    retryCount,
    incrementRetry,
    resetRetry,
    isOffline,
  };
};
