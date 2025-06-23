
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const PerformanceChart = () => {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Charts Coming Soon
        </h3>
        <p className="text-gray-600 max-w-md">
          We're working on advanced analytics and performance charts. 
          This feature will be available in the next update.
        </p>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
