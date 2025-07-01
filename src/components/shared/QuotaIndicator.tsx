import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap } from 'lucide-react';
import { useFeatureQuota } from '@/hooks/useFeatureQuota';
import { Link } from 'react-router-dom';

interface QuotaIndicatorProps {
  featureName: string;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export const QuotaIndicator = ({ 
  featureName, 
  showLabel = true, 
  compact = false,
  className = ""
}: QuotaIndicatorProps) => {
  const { data: quota, isLoading } = useFeatureQuota(featureName);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!quota?.limit) {
    return null; // Unlimited features don't show quota
  }

  const percentage = Math.min(100, (quota.used / quota.limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-warning';
    return 'bg-primary';
  };

  const getStatusVariant = () => {
    if (isAtLimit) return 'destructive';
    if (isNearLimit) return 'warning';
    return 'secondary';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Progress 
          value={percentage} 
          className="w-16 h-1.5" 
          data-progress-color={getProgressColor()}
        />
        <Badge variant={getStatusVariant()} className="text-xs px-1.5 py-0.5">
          {quota.used}/{quota.limit}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground capitalize">
            {featureName.replace('_', ' ')}
          </span>
          <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'}`}>
            {quota.used} / {quota.limit}
          </span>
        </div>
      )}
      
      <Progress 
        value={percentage} 
        className="w-full h-2" 
        data-progress-color={getProgressColor()}
      />
      
      {(isNearLimit || isAtLimit) && (
        <div className={`flex items-center gap-2 text-xs ${isAtLimit ? 'text-destructive' : 'text-warning'}`}>
          <AlertTriangle className="h-3 w-3" />
          <span>
            {isAtLimit 
              ? 'Quota exceeded' 
              : `${quota.remaining} uses remaining`
            }
          </span>
          {isAtLimit && (
            <Link 
              to="/pricing" 
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Zap className="h-3 w-3" />
              Upgrade
            </Link>
          )}
        </div>
      )}
    </div>
  );
};