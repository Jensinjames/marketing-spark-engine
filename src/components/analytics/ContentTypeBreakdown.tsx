
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ContentTypeBreakdown = () => {
  const contentTypes = [
    { name: "Email Campaigns", count: 45, total: 142, color: "bg-purple-500" },
    { name: "Social Posts", count: 38, total: 142, color: "bg-blue-500" },
    { name: "Landing Pages", count: 28, total: 142, color: "bg-green-500" },
    { name: "Blog Posts", count: 22, total: 142, color: "bg-orange-500" },
    { name: "Ad Copy", count: 9, total: 142, color: "bg-red-500" }
  ];

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle>Content Type Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contentTypes.map((type) => {
          const percentage = Math.round((type.count / type.total) * 100);
          return (
            <div key={type.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{type.name}</span>
                <span className="text-sm text-gray-600">{type.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${type.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ContentTypeBreakdown;
