
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
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    if (changeType === 'positive') return TrendingUp;
    if (changeType === 'negative') return TrendingDown;
    return null;
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card className="surface-elevated">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-elevated hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          {change && (
            <div className={`flex items-center gap-1 ${getChangeColor()}`}>
              {TrendIcon && <TrendIcon className="h-4 w-4" />}
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
