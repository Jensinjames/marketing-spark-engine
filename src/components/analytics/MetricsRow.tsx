
import { FileText, Eye, MousePointer, TrendingUp } from "lucide-react";
import StatCard from "@/components/shared/StatCard";

const MetricsRow = () => {
  const metrics = [
    {
      title: "Content Generated",
      value: "142",
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      description: "This month"
    },
    {
      title: "Total Views",
      value: "8,429",
      change: "+24%",
      changeType: "positive" as const,
      icon: Eye,
      description: "All time"
    },
    {
      title: "Click-through Rate",
      value: "3.2%",
      change: "-0.8%",
      changeType: "negative" as const,
      icon: MousePointer,
      description: "Average CTR"
    },
    {
      title: "Conversion Rate",
      value: "12.5%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "This month"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <StatCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
};

export default MetricsRow;
