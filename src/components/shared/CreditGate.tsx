
import { useUserPlan } from "@/hooks/useUserPlanQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface CreditGateProps {
  children: React.ReactNode;
  requiredCredits?: number;
  feature?: string;
}

const CreditGate = ({ 
  children, 
  requiredCredits = 1, 
  feature = "this action" 
}: CreditGateProps) => {
  const { plan, loading, error, isRefetching, refetch, hasCreditsRemaining } = useUserPlan();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Checking credits...</span>
      </div>
    );
  }

  // Show error state
  if (error || !plan) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Unable to check your credit balance. Please try again later.</span>
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
          >
            {isRefetching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Retry"
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Check if user has sufficient credits
  const remainingCredits = plan.monthlyLimit - plan.creditsUsed;
  
  if (!hasCreditsRemaining() || remainingCredits < requiredCredits) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Insufficient Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You need {requiredCredits} credit{requiredCredits !== 1 ? 's' : ''} to use {feature}.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Credits used:</span>
              <span className="font-medium">{plan.creditsUsed} / {plan.monthlyLimit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(plan.creditsUsed / plan.monthlyLimit) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/pricing">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade for More Credits
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default CreditGate;
