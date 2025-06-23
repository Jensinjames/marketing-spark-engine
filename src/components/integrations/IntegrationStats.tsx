
import { Plug, CheckCircle, Clock } from "lucide-react";
import StatCard from "@/components/shared/StatCard";

const IntegrationStats = () => {
  const stats = [
    {
      title: "Available",
      value: "12",
      icon: Plug,
      description: "Ready to connect"
    },
    {
      title: "Connected",
      value: "3",
      icon: CheckCircle,
      description: "Active integrations"
    },
    {
      title: "Coming Soon",
      value: "8",
      icon: Clock,
      description: "In development"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </div>
  );
};

export default IntegrationStats;
