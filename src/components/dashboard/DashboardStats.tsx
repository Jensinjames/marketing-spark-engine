
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  credits: { used: number; limit: number };
  assetsCount: number;
}

const DashboardStats = ({ credits, assetsCount }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Credits Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {credits.used}/{credits.limit}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(credits.used / credits.limit) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Assets Generated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{assetsCount}</div>
          <p className="text-sm text-gray-600 mt-1">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">Starter</div>
          <Button variant="link" className="text-purple-600 p-0 h-auto text-sm">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">1</div>
          <Button variant="link" className="text-purple-600 p-0 h-auto text-sm">
            Invite Members
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
