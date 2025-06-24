
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlanQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Zap, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanGateProps {
  requiredPlans: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
  graceful?: boolean; // New prop for graceful degradation
}

const PlanGate = ({ 
  requiredPlans, 
  children, 
  fallback, 
  feature = "this feature",
  graceful = false 
}: PlanGateProps) => {
  const { user } = useAuth();
  const { plan, loading, error, isRefetching, refetch, hasAccess } = useUserPlan();
  
  // Show loading state while checking plan
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" role="status" aria-live="polite">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600 mb-4" aria-hidden="true" />
            <p className="text-gray-600">Checking your plan access...</p>
            <span className="sr-only">Loading your plan information</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if plan data couldn't be loaded
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" role="alert">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error || "Please sign in to continue."}
            </p>
            <div className="space-y-2">
              {error && (
                <Button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  variant="outline"
                  className="w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-describedby="retry-description"
                >
                  {isRefetching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    "Try Again"
                  )}
                </Button>
              )}
              <div id="retry-description" className="sr-only">
                Click to retry loading your plan information
              </div>
              <Link to="/login">
                <Button className="w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access to the feature
  if (hasAccess(requiredPlans)) {
    return <>{children}</>;
  }

  // For graceful degradation, show limited version instead of blocking
  if (graceful && fallback) {
    return <>{fallback}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" role="main">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-purple-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900" id="upgrade-title">
            Upgrade Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4" aria-describedby="upgrade-description">
          <p id="upgrade-description" className="text-gray-600">
            Access to {feature} is available for {requiredPlans.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' and ')} plan members.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600" role="status">
            Current plan: <span className="font-medium capitalize">{plan?.planType || 'Unknown'}</span>
          </div>
          <div className="space-y-2">
            <Link to="/pricing">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                Upgrade Plan
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanGate;
