import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { FeatureGatingService, type FeatureUsageInfo } from '@/services/featureGatingService';

export const useFeatureQuota = (featureName: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['featureQuota', user?.id, featureName],
    queryFn: async (): Promise<FeatureUsageInfo> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      return FeatureGatingService.checkUsage(user.id, featureName);
    },
    enabled: !!user?.id && !!featureName,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on quota errors
      if (error?.name === 'QuotaError') {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useBulkFeatureQuotas = (featureNames: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bulkFeatureQuotas', user?.id, ...featureNames.sort()],
    queryFn: async (): Promise<Record<string, FeatureUsageInfo>> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      return FeatureGatingService.getBulkUsage(user.id, featureNames);
    },
    enabled: !!user?.id && featureNames.length > 0,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

// Hook to check if user can perform an action before doing it
export const useCanUseFeature = (featureName: string) => {
  const { data: quota, isLoading, error } = useFeatureQuota(featureName);

  return {
    canUse: quota?.canUse ?? false,
    remaining: quota?.remaining,
    limit: quota?.limit,
    used: quota?.used,
    isLoading,
    error,
    isQuotaExceeded: quota?.limit !== null && (quota?.used ?? 0) >= quota?.limit,
    isNearLimit: quota?.limit !== null && (quota?.used ?? 0) >= quota?.limit * 0.8,
  };
};