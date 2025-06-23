
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanGateProps {
  requiredPlans: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
}

const PlanGate = ({ 
  requiredPlans, 
  children, 
  fallback, 
  feature = "this feature" 
}: PlanGateProps) => {
  const { user } = useAuth();
  
  // For now, we'll check against a mock plan - this should be replaced with actual plan checking
  const userPlan = "starter"; // This should come from user context or API
  
  const hasAccess = requiredPlans.includes(userPlan);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Upgrade Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Access to {feature} is available for Growth and Elite plan members.
          </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanGate;
