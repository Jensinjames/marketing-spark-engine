import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  ChevronDown, 
  Copy, 
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level: 'page' | 'component' | 'critical';
  context?: string;
  showReportButton?: boolean;
  enableRecovery?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
  isReporting: boolean;
  showDetails: boolean;
  errorMetadata: ErrorMetadata;
}

interface ErrorMetadata {
  timestamp: string;
  userAgent: string;
  url: string;
  level: string;
  context: string;
  userId?: string;
  sessionId: string;
  buildVersion?: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  public state: State = {
    hasError: false,
    errorId: '',
    retryCount: 0,
    isReporting: false,
    showDetails: false,
    errorMetadata: {
      timestamp: '',
      userAgent: '',
      url: '',
      level: this.props.level,
      context: this.props.context || 'unknown',
      sessionId: this.generateSessionId()
    }
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      errorMetadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: 'component',
        context: 'unknown',
        sessionId: GlobalErrorBoundary.prototype.generateSessionId()
      }
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState(prevState => ({
      errorInfo,
      errorMetadata: {
        ...prevState.errorMetadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: this.props.level,
        context: this.props.context || 'error_boundary'
      }
    }));

    // Log error immediately
    this.logError(error, errorInfo);
    
    // Set up automatic retry for component-level errors
    if (this.props.enableRecovery && this.props.level === 'component' && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    // Clean up retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Prepare comprehensive error data
      const errorData = {
        error_id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_boundary_level: this.props.level,
        context: this.props.context,
        metadata: this.state.errorMetadata,
        props_info: this.sanitizeProps(),
        browser_info: this.getBrowserInfo(),
        performance_info: this.getPerformanceInfo()
      };

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Boundary [${this.props.level}]`);
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error Data:', errorData);
        console.groupEnd();
      }

      // Send to monitoring service (implement based on your monitoring solution)
      await this.sendToMonitoring(errorData);

      // Log to application audit system
      if (typeof window !== 'undefined') {
        // Use dynamic import to avoid circular dependencies
        const { SecurityAuditLogger } = await import('@/utils/enhancedSecurity');
        await SecurityAuditLogger.logSecurityEvent(
          'error_boundary_triggered',
          errorData,
          this.props.level === 'critical' ? 'critical' : 'medium'
        );
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private sanitizeProps(): any {
    try {
      // Remove sensitive data from props before logging
      const sanitized = { ...this.props };
      delete sanitized.children;
      
      // Remove any potential sensitive data
      return JSON.parse(JSON.stringify(sanitized, (key, value) => {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('secret')) {
          return '[REDACTED]';
        }
        return value;
      }));
    } catch (e) {
      return { error: 'Failed to sanitize props' };
    }
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private getPerformanceInfo() {
    try {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: perfData ? perfData.loadEventEnd - perfData.fetchStart : null,
        domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.fetchStart : null,
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    } catch (e) {
      return { error: 'Failed to collect performance info' };
    }
  }

  private async sendToMonitoring(errorData: any) {
    try {
      // Example integration with external monitoring services
      // Replace with your actual monitoring service (Sentry, LogRocket, etc.)
      
      // For now, we'll use a simple fetch to a monitoring endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        });
      }
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }

  private scheduleRetry() {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }, retryDelay);

    this.retryTimeouts.push(timeout);
  }

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  private handleReportError = async () => {
    this.setState({ isReporting: true });
    
    try {
      const { error, errorInfo, errorId, errorMetadata } = this.state;
      
      // Create detailed error report
      const errorReport = {
        error_id: errorId,
        error_message: error?.message,
        error_stack: error?.stack,
        component_stack: errorInfo?.componentStack,
        metadata: errorMetadata,
        user_description: 'Error reported by user via error boundary',
        reproduction_steps: 'Error occurred during normal application usage',
        browser_info: this.getBrowserInfo(),
        performance_info: this.getPerformanceInfo()
      };

      // Submit error report
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });

      toast.success('Error report submitted successfully. Thank you for helping us improve!');
      
    } catch (reportError) {
      console.error('Failed to submit error report:', reportError);
      toast.error('Failed to submit error report. Please try again or contact support.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private handleCopyError = () => {
    const { error, errorInfo, errorId, errorMetadata } = this.state;
    const errorText = `
Error ID: ${errorId}
Time: ${errorMetadata.timestamp}
Level: ${this.props.level}
Context: ${this.props.context}

Error: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  private renderErrorLevel() {
    const { level } = this.props;
    const levelConfig = {
      page: { color: 'bg-red-500', label: 'Page Error' },
      component: { color: 'bg-yellow-500', label: 'Component Error' },
      critical: { color: 'bg-red-600', label: 'Critical Error' }
    };

    const config = levelConfig[level] || levelConfig.component;

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, errorMetadata, isReporting, showDetails } = this.state;
      const { level, enableRecovery, maxRetries = 3 } = this.props;
      
      const canRetry = enableRecovery && this.state.retryCount < maxRetries;
      const isDevelopment = process.env.NODE_ENV === 'development';

      // Different UI based on error level
      if (level === 'component') {
        return (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-red-900 font-medium">Component Error</h4>
                  {this.renderErrorLevel()}
                </div>
                <p className="text-red-700 text-sm mb-3">
                  {error?.message || 'An unexpected error occurred in this component.'}
                </p>
                <div className="flex space-x-2">
                  {canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={this.handleManualRetry}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry ({maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => this.setState({ showDetails: !showDetails })}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                    Details
                  </Button>
                </div>
                {showDetails && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-xs">
                    <p><strong>Error ID:</strong> {errorId}</p>
                    <p><strong>Time:</strong> {new Date(errorMetadata.timestamp).toLocaleString()}</p>
                    {isDevelopment && error && (
                      <pre className="mt-2 text-red-800 overflow-auto">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Full page error UI for page and critical errors
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                {level === 'critical' ? (
                  <Shield className="h-8 w-8 text-red-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CardTitle className="text-red-900">
                  {level === 'critical' ? 'Critical System Error' : 'Application Error'}
                </CardTitle>
                {this.renderErrorLevel()}
              </div>
              <CardDescription className="text-red-700">
                {level === 'critical' 
                  ? 'A critical error has occurred that affects the security or stability of the application.'
                  : 'We encountered an unexpected error. Our team has been notified.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Error:</strong> {error?.message || 'An unexpected error occurred.'}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(errorMetadata.timestamp).toLocaleString()}
                      </span>
                      <span>ID: {errorId}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {isDevelopment && (
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => this.setState({ showDetails: !showDetails })}
                  >
                    Development Details
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                  </Button>
                  {showDetails && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-2">Error Stack:</h4>
                        <pre className="text-xs overflow-auto text-red-600 whitespace-pre-wrap max-h-40">
                          {error?.stack}
                        </pre>
                      </div>
                      {errorInfo && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="font-medium mb-2">Component Stack:</h4>
                          <pre className="text-xs overflow-auto text-blue-600 whitespace-pre-wrap max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleManualRetry}
                    className="flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                  </Button>
                )}

                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>

                <Button 
                  onClick={this.handleCopyError}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Details</span>
                </Button>

                {this.props.showReportButton !== false && (
                  <Button 
                    onClick={this.handleReportError}
                    disabled={isReporting}
                    className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700"
                  >
                    <Bug className="h-4 w-4" />
                    <span>{isReporting ? 'Reporting...' : 'Report Error'}</span>
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-gray-600 space-y-2">
                <p>
                  If this problem persists, please contact support with the error ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{errorId}</code>
                </p>
                <div className="flex justify-center items-center space-x-2 text-xs">
                  <span>Context: {this.props.context || 'Unknown'}</span>
                  <span>•</span>
                  <span>Level: {level}</span>
                  <span>•</span>
                  <span>Retries: {this.state.retryCount}/{maxRetries}</span>
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

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<Omit<Props, 'level'> & { children: ReactNode }> = ({ children, ...props }) => (
  <GlobalErrorBoundary level="page" enableRecovery={false} {...props}>
    {children}
  </GlobalErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'> & { children: ReactNode }> = ({ children, ...props }) => (
  <GlobalErrorBoundary level="component" enableRecovery={true} maxRetries={3} {...props}>
    {children}
  </GlobalErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<Omit<Props, 'level'> & { children: ReactNode }> = ({ children, ...props }) => (
  <GlobalErrorBoundary level="critical" enableRecovery={false} {...props}>
    {children}
  </GlobalErrorBoundary>
);

// HOC for adding error boundaries to components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    level?: 'page' | 'component' | 'critical';
    context?: string;
    fallback?: ReactNode;
  } = {}
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <GlobalErrorBoundary
      level={options.level || 'component'}
      context={options.context || Component.displayName || Component.name}
      fallback={options.fallback}
      enableRecovery={options.level === 'component'}
    >
      <Component {...props} ref={ref} />
    </GlobalErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default GlobalErrorBoundary;