
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, CheckCircle } from "lucide-react";

interface PlanData {
  creditsUsed: number;
  creditsLimit: number;
  nextBilling: string;
  status: string;
}

interface CurrentPlanCardsProps {
  planData: PlanData;
}

const CurrentPlanCards = ({ planData }: CurrentPlanCardsProps) => {
  const creditPercentage = (planData.creditsUsed / planData.creditsLimit) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {planData.creditsUsed}/{planData.creditsLimit}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
              style={{ width: `${creditPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(creditPercentage)}% of monthly limit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{planData.nextBilling}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Auto-renewal enabled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{planData.status}</div>
          <p className="text-xs text-muted-foreground mt-2">
            All systems operational
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentPlanCards;
