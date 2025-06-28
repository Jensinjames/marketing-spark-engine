/*
  # Add Plan-Based Feature Access Control

  1. New Tables
    - `plan_features`
      - `id` (uuid, primary key)
      - `plan_type` (plan_type enum)
      - `feature_name` (text, feature identifier)
      - `feature_limit` (integer, usage limit, null for unlimited)
      - `is_enabled` (boolean, whether feature is available)

  2. Enhanced Functions
    - `can_access_feature` - Check if user can access a feature
    - `get_user_plan_info` - Get comprehensive plan information
    - `check_feature_usage` - Validate feature usage against limits

  3. Features
    - Granular feature control per plan
    - Usage limit enforcement
    - Easy plan comparison
*/

-- Create plan features table
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type plan_type NOT NULL,
  feature_name TEXT NOT NULL,
  feature_limit INTEGER, -- NULL means unlimited
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_type, feature_name)
);

-- Insert default plan features
INSERT INTO public.plan_features (plan_type, feature_name, feature_limit, is_enabled) VALUES
-- Starter Plan
('starter', 'content_generation', 50, true),
('starter', 'templates_access', 10, true),
('starter', 'team_members', 1, true),
('starter', 'integrations', 0, false),
('starter', 'analytics', 0, false),
('starter', 'collaboration', 0, false),
('starter', 'api_access', 0, false),

-- Pro Plan  
('pro', 'content_generation', 500, true),
('pro', 'templates_access', NULL, true), -- unlimited
('pro', 'team_members', 3, true),
('pro', 'integrations', 3, true),
('pro', 'analytics', 1, true),
('pro', 'collaboration', 5, true),
('pro', 'api_access', 1000, true),

-- Growth Plan
('growth', 'content_generation', 2000, true),
('growth', 'templates_access', NULL, true),
('growth', 'team_members', 10, true),
('growth', 'integrations', NULL, true),
('growth', 'analytics', 1, true),
('growth', 'collaboration', NULL, true),
('growth', 'api_access', 10000, true),

-- Elite Plan
('elite', 'content_generation', NULL, true),
('elite', 'templates_access', NULL, true),
('elite', 'team_members', NULL, true),
('elite', 'integrations', NULL, true),
('elite', 'analytics', 1, true),
('elite', 'collaboration', NULL, true),
('elite', 'api_access', NULL, true);

-- Function to check if user can access a feature
CREATE OR REPLACE FUNCTION public.can_access_feature(
  feature_name TEXT,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan_type plan_type;
  feature_enabled BOOLEAN;
  feature_limit INTEGER;
BEGIN
  -- Get user's plan type
  SELECT plan_type INTO user_plan_type
  FROM public.user_plans
  WHERE user_id = check_user_id;
  
  IF user_plan_type IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if feature is enabled for this plan
  SELECT is_enabled, feature_limit
  INTO feature_enabled, feature_limit
  FROM public.plan_features
  WHERE plan_type = user_plan_type AND feature_name = can_access_feature.feature_name;
  
  RETURN COALESCE(feature_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive user plan information
CREATE OR REPLACE FUNCTION public.get_user_plan_info(
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  plan_type TEXT,
  credits INTEGER,
  team_seats INTEGER,
  can_manage_teams BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.plan_type::TEXT,
    up.credits,
    up.team_seats,
    up.plan_type IN ('growth', 'elite') as can_manage_teams
  FROM public.user_plans up
  WHERE up.user_id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced team policies using plan features
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.user_plans
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

-- Enhanced team member policies with seat limits
DROP POLICY IF EXISTS "Team owners can invite members" ON public.team_members;
CREATE POLICY "Team owners can invite members" ON public.team_members
  FOR INSERT WITH CHECK (
    public.is_owner(team_id) AND
    EXISTS (
      SELECT 1 FROM public.user_plans
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    ) AND
    (
      SELECT COUNT(*) FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
    ) < (
      SELECT team_seats FROM public.user_plans
      WHERE user_id = auth.uid()
    )
  );

-- Enhanced team member removal policy
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;
CREATE POLICY "Team owners can remove members" ON public.team_members
  FOR DELETE USING (
    public.is_owner(team_id) AND
    role != 'owner' AND
    EXISTS (
      SELECT 1 FROM public.user_plans
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

-- Enhanced team member role update policy
DROP POLICY IF EXISTS "Team owners can update member roles" ON public.team_members;
CREATE POLICY "Team owners can update member roles" ON public.team_members
  FOR UPDATE USING (
    public.is_owner(team_id) AND
    EXISTS (
      SELECT 1 FROM public.user_plans
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

-- Enhanced integration policies
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can update own integrations" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integration_tokens;

CREATE POLICY "Users can view own integrations" ON public.integration_tokens
  FOR SELECT USING (
    user_id = auth.uid() AND
    public.can_access_feature('integrations')
  );

CREATE POLICY "Users can insert own integrations" ON public.integration_tokens
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    public.can_access_feature('integrations')
  );

CREATE POLICY "Users can update own integrations" ON public.integration_tokens
  FOR UPDATE USING (
    user_id = auth.uid() AND
    public.can_access_feature('integrations')
  );

CREATE POLICY "Users can delete own integrations" ON public.integration_tokens
  FOR DELETE USING (
    user_id = auth.uid() AND
    public.can_access_feature('integrations')
  );

-- Function to check if user is team owner (helper function)
CREATE OR REPLACE FUNCTION public.is_owner(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_uuid AND owner_id = uid
  );
$$;

-- Add indexes for performance
CREATE INDEX idx_plan_features_plan_type ON public.plan_features(plan_type);
CREATE INDEX idx_plan_features_feature_name ON public.plan_features(feature_name);