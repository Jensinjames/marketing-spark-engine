
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPlan {
  planType: 'starter' | 'pro' | 'growth' | 'elite';
  credits: number;
  creditsUsed: number;
  monthlyLimit: number;
  teamSeats: number;
  status: string;
}

export const useUserPlan = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchUserPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user plan data
        const { data: planData, error: planError } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (planError) {
          console.error('Error fetching user plan:', planError);
          setError('Failed to fetch plan data');
          return;
        }

        // Fetch user credits data
        const { data: creditsData, error: creditsError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (creditsError) {
          console.error('Error fetching user credits:', creditsError);
          setError('Failed to fetch credits data');
          return;
        }

        setPlan({
          planType: planData.plan_type,
          credits: planData.credits,
          creditsUsed: creditsData.credits_used,
          monthlyLimit: creditsData.monthly_limit,
          teamSeats: planData.team_seats,
          status: planData.status
        });
      } catch (err) {
        console.error('Unexpected error fetching plan:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [user]);

  const hasAccess = (requiredPlans: string[]): boolean => {
    if (!plan) return false;
    return requiredPlans.includes(plan.planType);
  };

  const canManageTeams = (): boolean => {
    if (!plan) return false;
    return ['growth', 'elite'].includes(plan.planType);
  };

  const hasCreditsRemaining = (): boolean => {
    if (!plan) return false;
    return plan.creditsUsed < plan.monthlyLimit;
  };

  return {
    plan,
    loading,
    error,
    hasAccess,
    canManageTeams,
    hasCreditsRemaining
  };
};
