
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlanQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface CreditGateProps {
  requiredCredits: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
}

const CreditGate = ({ 
  requiredCredits, 
  children, 
  fallback, 
  feature = "this feature" 
}: CreditGateProps) => {
  const { user } = useAuth();
  const { plan, loading, error, hasCreditsRemaining } = useUserPlan();
  
  // Show loading state while checking credits
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Checking your credits...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if plan data couldn't be loaded
  if (error || !user || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Unable to Check Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error || "Please sign in to continue."}
            </p>
            <div className="space-y-2">
              <Link to="/login">
                <Button className="w-full">
                  Sign In
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
      </div>
    );
  }

  const remainingCredits = plan.monthlyLimit - plan.creditsUsed;
  const hasEnoughCredits = remainingCredits >= requiredCredits;
  const usagePercentage = (plan.creditsUsed / plan.monthlyLimit) * 100;

  // If user has enough credits, show the feature
  if (hasEnoughCredits && hasCreditsRemaining()) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show credit upgrade prompt
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {remainingCredits <= 0 ? 'Credits Exhausted' : 'Insufficient Credits'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {feature} requires {requiredCredits} credit{requiredCredits > 1 ? 's' : ''}, 
              but you only have {remainingCredits} remaining.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credits Used</span>
                <span className="font-medium">
                  {plan.creditsUsed} / {plan.monthlyLimit}
                </span>
              </div>
              <Progress 
                value={Math.min(usagePercentage, 100)} 
                className="h-2"
              />
              {usagePercentage >= 100 && (
                <p className="text-xs text-red-600">
                  Monthly limit exceeded
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Link to="/pricing">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {plan.planType === 'starter' && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Pro plan starts at just $19/month with 500 credits
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditGate;
