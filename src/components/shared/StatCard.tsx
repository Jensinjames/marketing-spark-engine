
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      <Card className="surface-elevated" role="status" aria-label="Loading statistics">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="surface-elevated hover:shadow-md transition-all duration-200 focus-visible"
      role="img" 
      aria-label={`${title}: ${value}${change ? ` (${change})` : ''}`}
      tabIndex={0}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground" id={`stat-title-${title.replace(/\s+/g, '-')}`}>
            {title}
          </p>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg" aria-hidden="true">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p 
              className="text-3xl font-bold text-foreground mb-1"
              aria-describedby={`stat-title-${title.replace(/\s+/g, '-')}`}
            >
              {value}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {change && (
            <div 
              className={`flex items-center gap-1 ${getChangeColor()}`}
              role="img"
              aria-label={`${changeType === 'positive' ? 'Increase' : changeType === 'negative' ? 'Decrease' : 'Change'} of ${change}`}
            >
              {TrendIcon && <TrendIcon className="h-4 w-4" aria-hidden="true" />}
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
