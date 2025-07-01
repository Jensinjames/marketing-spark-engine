-- User Team Preferences and Onboarding System
-- This migration adds user preferences, onboarding tracking, and UX improvements

-- User team preferences table
CREATE TABLE IF NOT EXISTS public.user_team_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  notification_settings JSONB NOT NULL DEFAULT '{
    "email_invitations": true,
    "team_activity": true,
    "credit_notifications": true,
    "weekly_summary": false
  }'::jsonb,
  ui_preferences JSONB NOT NULL DEFAULT '{
    "show_onboarding": true,
    "show_guided_tour": true,
    "default_view": "members",
    "compact_mode": false
  }'::jsonb,
  onboarding_progress JSONB NOT NULL DEFAULT '{
    "completed_steps": [],
    "current_step": null,
    "completed_at": null
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User onboarding sessions (for analytics and improvement)
CREATE TABLE IF NOT EXISTS public.user_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('first_time', 'team_switch', 'feature_discovery')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  steps_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps_skipped JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_rate DECIMAL(5,2), -- Percentage of steps completed
  total_time_seconds INTEGER, -- Time spent in onboarding
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guided tour progress tracking
CREATE TABLE IF NOT EXISTS public.user_guided_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL, -- 'team_management', 'content_creation', 'analytics', etc.
  context_data JSONB, -- Additional context like team_id, page, etc.
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  steps_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Step-specific data and progress
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tour_id)
);

-- User feature discovery tracking
CREATE TABLE IF NOT EXISTS public.user_feature_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL, -- 'bulk_actions', 'advanced_analytics', 'team_insights', etc.
  discovery_method TEXT NOT NULL CHECK (discovery_method IN ('guided_tour', 'exploration', 'tooltip', 'announcement')),
  context_data JSONB, -- Page, team_id, related actions, etc.
  interaction_type TEXT CHECK (interaction_type IN ('viewed', 'clicked', 'completed', 'dismissed')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team navigation history for better UX
CREATE TABLE IF NOT EXISTS public.user_team_navigation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('view', 'edit', 'create', 'delete', 'export')),
  session_id TEXT,
  time_spent_seconds INTEGER,
  navigation_source TEXT, -- 'direct', 'menu', 'link', 'breadcrumb', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_team_preferences_user_id 
ON public.user_team_preferences(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_team_preferences_default_team 
ON public.user_team_preferences(default_team_id) WHERE default_team_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_onboarding_sessions_user_team 
ON public.user_onboarding_sessions(user_id, team_id, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_onboarding_sessions_completion 
ON public.user_onboarding_sessions(completion_rate, completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_guided_tours_user_status 
ON public.user_guided_tours(user_id, status, last_interaction_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_guided_tours_tour_status 
ON public.user_guided_tours(tour_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_feature_discoveries_user_feature 
ON public.user_feature_discoveries(user_id, feature_id, discovered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_feature_discoveries_feature_method 
ON public.user_feature_discoveries(feature_id, discovery_method, discovered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_team_navigation_user_team_created 
ON public.user_team_navigation_history(user_id, team_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_team_navigation_session_path 
ON public.user_team_navigation_history(session_id, page_path, created_at);

-- Functions for onboarding and UX analytics

-- Function to start an onboarding session
CREATE OR REPLACE FUNCTION public.start_onboarding_session(
  p_user_id UUID,
  p_team_id UUID DEFAULT NULL,
  p_session_type TEXT DEFAULT 'first_time',
  p_device_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO public.user_onboarding_sessions (
    user_id,
    team_id,
    session_type,
    device_info
  ) VALUES (
    p_user_id,
    p_team_id,
    p_session_type,
    p_device_info
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete an onboarding session
CREATE OR REPLACE FUNCTION public.complete_onboarding_session(
  p_session_id UUID,
  p_completion_rate DECIMAL DEFAULT NULL
) RETURNS void AS $$
DECLARE
  session_start TIMESTAMPTZ;
  total_time INTEGER;
BEGIN
  -- Get session start time
  SELECT started_at INTO session_start
  FROM public.user_onboarding_sessions
  WHERE id = p_session_id;
  
  -- Calculate total time
  total_time := EXTRACT(EPOCH FROM (NOW() - session_start))::INTEGER;
  
  -- Update session
  UPDATE public.user_onboarding_sessions
  SET 
    completed_at = NOW(),
    completion_rate = p_completion_rate,
    total_time_seconds = total_time
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record feature discovery
CREATE OR REPLACE FUNCTION public.record_feature_discovery(
  p_user_id UUID,
  p_feature_id TEXT,
  p_discovery_method TEXT,
  p_interaction_type TEXT DEFAULT 'viewed',
  p_context_data JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_feature_discoveries (
    user_id,
    feature_id,
    discovery_method,
    interaction_type,
    context_data
  ) VALUES (
    p_user_id,
    p_feature_id,
    p_discovery_method,
    p_interaction_type,
    p_context_data
  )
  ON CONFLICT (user_id, feature_id) 
  DO UPDATE SET
    usage_count = user_feature_discoveries.usage_count + 1,
    first_used_at = CASE 
      WHEN user_feature_discoveries.first_used_at IS NULL AND p_interaction_type IN ('clicked', 'completed')
      THEN NOW()
      ELSE user_feature_discoveries.first_used_at
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record team navigation
CREATE OR REPLACE FUNCTION public.record_team_navigation(
  p_user_id UUID,
  p_team_id UUID,
  p_page_path TEXT,
  p_action_type TEXT DEFAULT 'view',
  p_session_id TEXT DEFAULT NULL,
  p_navigation_source TEXT DEFAULT 'direct'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_team_navigation_history (
    user_id,
    team_id,
    page_path,
    action_type,
    session_id,
    navigation_source
  ) VALUES (
    p_user_id,
    p_team_id,
    p_page_path,
    p_action_type,
    p_session_id,
    p_navigation_source
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get onboarding analytics
CREATE OR REPLACE FUNCTION public.get_onboarding_analytics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE(
  total_sessions INTEGER,
  completed_sessions INTEGER,
  avg_completion_rate DECIMAL,
  avg_time_seconds DECIMAL,
  most_common_dropoff_step TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sessions,
    COUNT(completed_at)::INTEGER as completed_sessions,
    ROUND(AVG(completion_rate), 2) as avg_completion_rate,
    ROUND(AVG(total_time_seconds), 0) as avg_time_seconds,
    -- This would need more complex logic to determine dropoff step
    'team_overview'::TEXT as most_common_dropoff_step
  FROM public.user_onboarding_sessions
  WHERE started_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old navigation history
CREATE OR REPLACE FUNCTION public.cleanup_old_navigation_history()
RETURNS void AS $$
BEGIN
  -- Keep only last 90 days of navigation history
  DELETE FROM public.user_team_navigation_history 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep only completed onboarding sessions older than 1 year
  DELETE FROM public.user_onboarding_sessions 
  WHERE created_at < NOW() - INTERVAL '1 year' AND completed_at IS NOT NULL;
  
  -- Keep only feature discoveries older than 1 year with no usage
  DELETE FROM public.user_feature_discoveries 
  WHERE created_at < NOW() - INTERVAL '1 year' AND usage_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_team_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_team_preferences_updated_at ON public.user_team_preferences;
CREATE TRIGGER trigger_update_user_team_preferences_updated_at
  BEFORE UPDATE ON public.user_team_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_team_preferences_updated_at();

-- RLS Policies

-- User team preferences - users can only manage their own
ALTER TABLE public.user_team_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own team preferences" ON public.user_team_preferences
FOR ALL USING (user_id = auth.uid());

-- User onboarding sessions - users can view their own, admins can view all
ALTER TABLE public.user_onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding sessions" ON public.user_onboarding_sessions
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Users can create own onboarding sessions" ON public.user_onboarding_sessions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding sessions" ON public.user_onboarding_sessions
FOR UPDATE USING (user_id = auth.uid());

-- User guided tours - users can only manage their own
ALTER TABLE public.user_guided_tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own guided tours" ON public.user_guided_tours
FOR ALL USING (user_id = auth.uid());

-- User feature discoveries - users can view their own, admins can view all
ALTER TABLE public.user_feature_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature discoveries" ON public.user_feature_discoveries
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Users can create own feature discoveries" ON public.user_feature_discoveries
FOR INSERT WITH CHECK (user_id = auth.uid());

-- User team navigation history - users can view their own, admins can view all
ALTER TABLE public.user_team_navigation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own navigation history" ON public.user_team_navigation_history
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Users can create own navigation history" ON public.user_team_navigation_history
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE public.user_team_preferences IS 'User-specific team preferences including notifications, UI settings, and onboarding progress';
COMMENT ON TABLE public.user_onboarding_sessions IS 'Tracking user onboarding sessions for analytics and UX improvement';
COMMENT ON TABLE public.user_guided_tours IS 'Progress tracking for guided tours and feature discovery';
COMMENT ON TABLE public.user_feature_discoveries IS 'Analytics on how users discover and use features';
COMMENT ON TABLE public.user_team_navigation_history IS 'User navigation patterns for UX analytics and improvements';

COMMENT ON FUNCTION public.start_onboarding_session IS 'Initiates a new onboarding session for analytics tracking';
COMMENT ON FUNCTION public.record_feature_discovery IS 'Records when users discover and interact with features';
COMMENT ON FUNCTION public.get_onboarding_analytics IS 'Provides analytics on onboarding completion and user experience';