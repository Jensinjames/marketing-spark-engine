
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  BarChart3,
  Zap
} from "lucide-react";

const Analytics = () => {
  const [dateFilter, setDateFilter] = useState("Last 30 days");

  const metrics = [
    {
      title: "Content Generated",
      value: "24",
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText
    },
    {
      title: "Total Views",
      value: "1,429",
      change: "+8%",
      changeType: "positive" as const,
      icon: Eye
    },
    {
      title: "Click-through Rate",
      value: "3.2%",
      change: "+0.3%",
      changeType: "positive" as const,
      icon: MousePointer
    },
    {
      title: "Conversion Rate",
      value: "2.1%",
      change: "-0.1%",
      changeType: "negative" as const,
      icon: TrendingUp
    }
  ];

  const contentTypeData = [
    { type: "Email Sequences", count: 8, percentage: 33 },
    { type: "Ad Copy", count: 6, percentage: 25 },
    { type: "Social Posts", count: 5, percentage: 21 },
    { type: "Landing Pages", count: 3, percentage: 13 },
    { type: "Blog Posts", count: 2, percentage: 8 }
  ];

  const handleExport = () => {
    console.log("Exporting analytics data...");
  };

  return (
    <Layout>
      <PageHeader
        title="Analytics"
        description="Track your content performance and marketing insights"
        showExport={true}
        showDateFilter={true}
        dateFilter={dateFilter}
        onExport={handleExport}
        onDateFilterChange={setDateFilter}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <StatCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Overview Chart */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="Charts Coming Soon"
              description="Advanced performance charts and insights will be available in the next update."
            />
          </CardContent>
        </Card>

        {/* Content Type Performance */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Content Type Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentTypeData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {item.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.count} pieces
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <div className="text-xs text-gray-500 text-right">
                  {item.percentage}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Banner */}
      <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-gray-600 mb-6">
              Get deeper insights with advanced charts, ROI tracking, and performance comparisons.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Analytics;
