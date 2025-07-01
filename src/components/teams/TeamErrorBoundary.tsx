import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showReportButton?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isReporting?: boolean;
}

class TeamErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isReporting: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for monitoring
    this.logSecurityEvent(error, errorInfo);
    
    console.error('TeamErrorBoundary caught an error:', error, errorInfo);
  }

  private async logSecurityEvent(error: Error, errorInfo: ErrorInfo) {
    try {
      // Get current user context
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare error context
      const errorContext = {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_boundary_context: this.props.context || 'teams_management',
        user_id: user?.id || null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        error_id: this.state.errorId
      };

      // Log to audit system
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'frontend_error_boundary_triggered',
        p_table_name: 'error_logs',
        p_new_values: errorContext
      });

      // In production, you might also want to send to external error tracking
      // like Sentry, LogRocket, etc.
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { contexts: { errorBoundary: errorContext } });
      }

    } catch (loggingError) {
      console.error('Failed to log error to audit system:', loggingError);
    }
  }

  private handleReportError = async () => {
    this.setState({ isReporting: true });
    
    try {
      const { error, errorInfo, errorId } = this.state;
      
      // Create a user-friendly error report
      const errorReport = {
        error_id: errorId,
        description: 'User-reported error from error boundary',
        steps_to_reproduce: 'Error occurred during normal usage',
        expected_behavior: 'Application should work normally',
        actual_behavior: error?.message || 'Application crashed',
        additional_context: {
          component_context: this.props.context,
          error_stack: error?.stack,
          component_stack: errorInfo?.componentStack,
          url: window.location.href
        }
      };

      // Log the user report
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'user_error_report_submitted',
        p_table_name: 'error_reports',
        p_new_values: errorReport
      });

      // Show success message (you might want to use a toast here)
      alert('Error report submitted successfully. Thank you for helping us improve!');
      
    } catch (reportError) {
      console.error('Failed to submit error report:', reportError);
      alert('Failed to submit error report. Please try again or contact support.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Oops! Something went wrong</CardTitle>
              <CardDescription className="text-red-700">
                We encountered an unexpected error in the teams management system. 
                {errorId && (
                  <span className="block mt-2 text-sm font-mono bg-red-100 px-2 py-1 rounded">
                    Error ID: {errorId}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || 'An unexpected error occurred while rendering the component.'}
                </AlertDescription>
              </Alert>

              {isDevelopment && error && (
                <details className="border rounded-lg p-4 bg-gray-50">
                  <summary className="cursor-pointer font-medium mb-2">
                    Development Error Details
                  </summary>
                  <pre className="text-xs overflow-auto text-red-600 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Component Stack:</h4>
                      <pre className="text-xs overflow-auto text-blue-600 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </details>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>

                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>

                {this.props.showReportButton !== false && (
                  <Button 
                    onClick={this.handleReportError}
                    disabled={this.state.isReporting}
                    className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700"
                  >
                    <Bug className="h-4 w-4" />
                    <span>
                      {this.state.isReporting ? 'Reporting...' : 'Report Error'}
                    </span>
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-gray-600 space-y-2">
                <p>
                  If this problem persists, please contact our support team with the error ID above.
                </p>
                <div className="flex justify-center space-x-4 text-xs">
                  <span>Context: {this.props.context || 'Teams Management'}</span>
                  <span>•</span>
                  <span>Time: {new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier usage
export const withTeamErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <TeamErrorBoundary context={context}>
      <Component {...props} ref={ref} />
    </TeamErrorBoundary>
  ));
};

// Hook for error reporting within components
export const useErrorReporting = () => {
  const reportError = async (error: Error, context?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorReport = {
        error_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error_message: error.message,
        error_stack: error.stack,
        context: context || 'manual_report',
        user_id: user?.id || null,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'manual_error_report',
        p_table_name: 'error_logs',
        p_new_values: errorReport
      });

      return errorReport.error_id;
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      throw reportError;
    }
  };

  return { reportError };
};

export default TeamErrorBoundary;