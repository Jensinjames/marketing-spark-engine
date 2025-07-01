import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useTeamMembersWithCredits } from '@/hooks/useTeamMembersWithCredits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Team context types
export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  name: string;
  email: string;
  avatar_url?: string;
  joined_at: string;
  credits: {
    credits_used: number;
    monthly_limit: number;
    credits_remaining: number;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  owner_id: string;
  member_count: number;
  plan: 'growth' | 'elite';
}

export interface TeamStatistics {
  total_members: number;
  active_members: number;
  pending_invitations: number;
  total_credits_used: number;
  total_credits_limit: number;
  content_generated_this_month: number;
}

export interface UserTeamPreferences {
  default_team_id?: string;
  notification_settings: {
    email_invitations: boolean;
    team_activity: boolean;
    credit_notifications: boolean;
    weekly_summary: boolean;
  };
  ui_preferences: {
    show_onboarding: boolean;
    show_guided_tour: boolean;
    default_view: 'members' | 'analytics' | 'bulk';
    compact_mode: boolean;
  };
  onboarding_progress: {
    completed_steps: string[];
    current_step?: string;
    completed_at?: string;
  };
}

interface TeamContextType {
  // Team data
  teams: Team[] | undefined;
  currentTeam: Team | null;
  currentTeamMembers: TeamMember[] | undefined;
  currentTeamStatistics: TeamStatistics | undefined;
  
  // Loading states
  teamsLoading: boolean;
  teamDataLoading: boolean;
  
  // Team operations
  setCurrentTeam: (teamId: string) => void;
  switchTeam: (teamId: string) => void;
  refreshTeamData: () => void;
  
  // User preferences
  userPreferences: UserTeamPreferences | null;
  updateUserPreferences: (preferences: Partial<UserTeamPreferences>) => Promise<void>;
  
  // Onboarding
  isOnboardingComplete: boolean;
  currentOnboardingStep: string | null;
  completeOnboardingStep: (stepId: string) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  
  // Team context utilities
  getCurrentUserRole: () => string | null;
  isTeamAdmin: () => boolean;
  hasTeamPermission: (permission: 'invite' | 'manage' | 'delete' | 'view_analytics') => boolean;
  
  // Team switching with state preservation
  teamHistory: string[];
  goBackToPreviousTeam: () => void;
}

const defaultUserPreferences: UserTeamPreferences = {
  notification_settings: {
    email_invitations: true,
    team_activity: true,
    credit_notifications: true,
    weekly_summary: false,
  },
  ui_preferences: {
    show_onboarding: true,
    show_guided_tour: true,
    default_view: 'members',
    compact_mode: false,
  },
  onboarding_progress: {
    completed_steps: [],
  },
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeamContext = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useUserTeams();
  
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserTeamPreferences | null>(null);
  const [teamHistory, setTeamHistory] = useState<string[]>([]);
  
  const { 
    data: teamData, 
    isLoading: teamDataLoading,
    refetch: refetchTeamData
  } = useTeamMembersWithCredits(currentTeamId);

  // Load user preferences on user change
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      setUserPreferences(null);
      setCurrentTeamId(null);
      setTeamHistory([]);
    }
  }, [user]);

  // Auto-select default team or first available team
  useEffect(() => {
    if (teams && teams.length > 0 && !currentTeamId) {
      const defaultTeamId = userPreferences?.default_team_id;
      const teamToSelect = defaultTeamId && teams.find(t => t.id === defaultTeamId) 
        ? defaultTeamId 
        : teams[0].id;
      
      setCurrentTeamId(teamToSelect);
    }
  }, [teams, userPreferences?.default_team_id, currentTeamId]);

  const loadUserPreferences = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_team_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Failed to load user preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences({
          default_team_id: data.default_team_id,
          notification_settings: data.notification_settings || defaultUserPreferences.notification_settings,
          ui_preferences: data.ui_preferences || defaultUserPreferences.ui_preferences,
          onboarding_progress: data.onboarding_progress || defaultUserPreferences.onboarding_progress,
        });
      } else {
        // Create default preferences for new user
        setUserPreferences(defaultUserPreferences);
        await updateUserPreferences(defaultUserPreferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setUserPreferences(defaultUserPreferences);
    }
  };

  const updateUserPreferences = async (newPreferences: Partial<UserTeamPreferences>): Promise<void> => {
    try {
      if (!user) throw new Error('User must be logged in');

      const updatedPreferences = { ...userPreferences, ...newPreferences };
      setUserPreferences(updatedPreferences);

      const { error } = await supabase
        .from('user_team_preferences')
        .upsert({
          user_id: user.id,
          default_team_id: updatedPreferences.default_team_id,
          notification_settings: updatedPreferences.notification_settings,
          ui_preferences: updatedPreferences.ui_preferences,
          onboarding_progress: updatedPreferences.onboarding_progress,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      toast.error('Failed to update preferences');
      throw error;
    }
  };

  const setCurrentTeam = (teamId: string) => {
    if (teamId !== currentTeamId) {
      // Add current team to history
      if (currentTeamId) {
        setTeamHistory(prev => [currentTeamId, ...prev.slice(0, 4)]); // Keep last 5
      }
      setCurrentTeamId(teamId);
    }
  };

  const switchTeam = async (teamId: string) => {
    try {
      setCurrentTeam(teamId);
      
      // Update default team preference
      if (userPreferences) {
        await updateUserPreferences({ default_team_id: teamId });
      }
      
      toast.success('Team switched successfully');
    } catch (error) {
      console.error('Failed to switch team:', error);
      toast.error('Failed to switch team');
    }
  };

  const refreshTeamData = () => {
    refetchTeams();
    refetchTeamData();
  };

  const getCurrentUserRole = (): string | null => {
    if (!teamData?.members || !user) return null;
    
    const currentMember = teamData.members.find(m => m.user_id === user.id);
    return currentMember?.role || null;
  };

  const isTeamAdmin = (): boolean => {
    const role = getCurrentUserRole();
    return role === 'owner' || role === 'admin';
  };

  const hasTeamPermission = (permission: 'invite' | 'manage' | 'delete' | 'view_analytics'): boolean => {
    const role = getCurrentUserRole();
    if (!role) return false;

    const permissions = {
      owner: ['invite', 'manage', 'delete', 'view_analytics'],
      admin: ['invite', 'manage', 'view_analytics'],
      editor: ['view_analytics'],
      viewer: []
    };

    return permissions[role as keyof typeof permissions]?.includes(permission) || false;
  };

  const completeOnboardingStep = async (stepId: string): Promise<void> => {
    try {
      if (!userPreferences) return;

      const completedSteps = [...(userPreferences.onboarding_progress.completed_steps || [])];
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      const updatedProgress = {
        ...userPreferences.onboarding_progress,
        completed_steps: completedSteps,
      };

      // Check if all required steps are completed
      const requiredSteps = ['team_overview', 'invite_members', 'explore_features', 'first_content'];
      const allCompleted = requiredSteps.every(step => completedSteps.includes(step));

      if (allCompleted && !updatedProgress.completed_at) {
        updatedProgress.completed_at = new Date().toISOString();
        toast.success('Onboarding completed! Welcome to your team! 🎉');
      }

      await updateUserPreferences({
        onboarding_progress: updatedProgress
      });

    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
      toast.error('Failed to update onboarding progress');
    }
  };

  const skipOnboarding = async (): Promise<void> => {
    try {
      await updateUserPreferences({
        ui_preferences: {
          ...userPreferences?.ui_preferences,
          show_onboarding: false,
        },
        onboarding_progress: {
          ...userPreferences?.onboarding_progress,
          completed_at: new Date().toISOString(),
        }
      });
      toast.success('Onboarding skipped');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast.error('Failed to skip onboarding');
    }
  };

  const goBackToPreviousTeam = () => {
    if (teamHistory.length > 0) {
      const previousTeamId = teamHistory[0];
      setTeamHistory(prev => prev.slice(1));
      setCurrentTeamId(previousTeamId);
    }
  };

  // Derived values
  const currentTeam = teams?.find(t => t.id === currentTeamId) || null;
  const currentTeamMembers = teamData?.members;
  const currentTeamStatistics = teamData?.statistics;
  
  const isOnboardingComplete = userPreferences?.onboarding_progress.completed_at !== undefined;
  const currentOnboardingStep = userPreferences?.onboarding_progress.current_step || null;

  const contextValue: TeamContextType = {
    // Team data
    teams,
    currentTeam,
    currentTeamMembers,
    currentTeamStatistics,
    
    // Loading states
    teamsLoading,
    teamDataLoading,
    
    // Team operations
    setCurrentTeam,
    switchTeam,
    refreshTeamData,
    
    // User preferences
    userPreferences,
    updateUserPreferences,
    
    // Onboarding
    isOnboardingComplete,
    currentOnboardingStep,
    completeOnboardingStep,
    skipOnboarding,
    
    // Team context utilities
    getCurrentUserRole,
    isTeamAdmin,
    hasTeamPermission,
    
    // Team switching
    teamHistory,
    goBackToPreviousTeam,
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// HOC for components that require team context
export const withTeamContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <TeamProvider>
      <Component {...props} ref={ref} />
    </TeamProvider>
  ));
};

export default TeamProvider;