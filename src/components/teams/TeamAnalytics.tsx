
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TeamAdminData } from "@/hooks/useTeamMembersWithCredits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CreditCard, Calendar } from "lucide-react";

interface TeamAnalyticsProps {
  teamData: TeamAdminData;
}

export const TeamAnalytics = React.memo(({ teamData }: TeamAnalyticsProps) => {
  const { members, statistics } = teamData;

  // Memoize expensive calculations
  const creditUsageData = React.useMemo(() => 
    members.map(member => ({
      name: member.name.split(' ')[0],
      used: member.credits.credits_used,
      remaining: member.credits.credits_remaining,
      limit: member.credits.monthly_limit
    })), [members]
  );

  const roleDistribution = React.useMemo(() => 
    members.reduce((acc: any[], member) => {
      const existing = acc.find(item => item.role === member.role);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ role: member.role, count: 1 });
      }
      return acc;
    }, []), [members]
  );

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const topUsers = React.useMemo(() => 
    [...members]
      .sort((a, b) => b.credits.credits_used - a.credits.credits_used)
      .slice(0, 5), [members]
  );

  const avgUtilization = React.useMemo(() => 
    members.length > 0 
      ? members.reduce((sum, member) => 
          sum + (member.credits.credits_used / member.credits.monthly_limit * 100), 0
        ) / members.length 
      : 0, [members]
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{statistics.active_members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Credits Pool</p>
                <p className="text-2xl font-bold">{statistics.total_credits_available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{statistics.total_credits_used}</p>
                <p className="text-xs text-gray-500">credits used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage by Member</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creditUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="used" fill="#8884d8" name="Used" />
                <Bar dataKey="remaining" fill="#82ca9d" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, count }) => `${role}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Credit Users This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{member.credits.credits_used} credits</p>
                  <Progress 
                    value={(member.credits.credits_used / member.credits.monthly_limit) * 100}
                    className="w-24 h-2 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TeamAnalytics.displayName = 'TeamAnalytics';
