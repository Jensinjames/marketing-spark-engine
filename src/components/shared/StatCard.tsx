import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  description?: string;
  loading?: boolean;
}
const StatCard = React.memo(({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
  loading = false
}: StatCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  const getTrendIcon = () => {
    if (changeType === 'positive') return TrendingUp;
    if (changeType === 'negative') return TrendingDown;
    return null;
  };
  const TrendIcon = getTrendIcon();
  if (loading) {
    return <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6 py-[12px] my-px mx-0 px-[3px] rounded">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-zinc-100">{title}</p>
          {Icon && <div className="p-2 bg-purple-50 rounded-lg">
              <Icon className="h-5 w-5 text-purple-600" />
            </div>}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          
          {change && <div className={`flex items-center gap-1 ${getChangeColor()}`}>
              {TrendIcon && <TrendIcon className="h-4 w-4" />}
              <span className="text-sm font-medium">{change}</span>
            </div>}
        </div>
      </CardContent>
    </Card>;
});
StatCard.displayName = 'StatCard';
export default StatCard;