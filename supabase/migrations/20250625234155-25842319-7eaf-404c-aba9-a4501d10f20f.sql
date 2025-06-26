
-- Phase 1: Critical Database Security Fixes

-- First, ensure all tables have RLS enabled (some may already be enabled)
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can insert their own plan" ON public.user_plans;

DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;

DROP POLICY IF EXISTS "Users can view their own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can insert their own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can update their own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can delete their own content" ON public.generated_content;

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integration_tokens;

DROP POLICY IF EXISTS "Team owners can manage their teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their team memberships" ON public.team_members;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Create comprehensive RLS policies for user_plans
CREATE POLICY "Users can view own plan" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan" ON public.user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create comprehensive RLS policies for user_credits
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create comprehensive RLS policies for generated_content
CREATE POLICY "Users can view own content" ON public.generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content" ON public.generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON public.generated_content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON public.generated_content
  FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for integration_tokens
CREATE POLICY "Users can view own integrations" ON public.integration_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON public.integration_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.integration_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.integration_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create simplified team RLS policies
CREATE POLICY "Team owners can manage teams" ON public.teams
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

-- Create team member policies
CREATE POLICY "Team members can view team memberships" ON public.team_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own team membership" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add database-level validation constraints
ALTER TABLE public.user_credits 
  ADD CONSTRAINT credits_used_non_negative CHECK (credits_used >= 0),
  ADD CONSTRAINT monthly_limit_positive CHECK (monthly_limit > 0),
  ADD CONSTRAINT credits_within_limit CHECK (credits_used <= monthly_limit * 2); -- Allow 2x overage for edge cases

ALTER TABLE public.user_plans 
  ADD CONSTRAINT credits_positive CHECK (credits > 0),
  ADD CONSTRAINT team_seats_positive CHECK (team_seats > 0);

-- Add NOT NULL constraints for critical security fields
ALTER TABLE public.generated_content ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_credits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.integration_tokens ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.team_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN owner_id SET NOT NULL;

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing audit logs for admin users (will need to implement admin role system)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (false); -- Temporarily block all access until admin system is implemented

-- Create function to log sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables that have the column
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_plans_updated_at 
  BEFORE UPDATE ON public.user_plans 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at 
  BEFORE UPDATE ON public.user_credits 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at 
  BEFORE UPDATE ON public.generated_content 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_tokens_updated_at 
  BEFORE UPDATE ON public.integration_tokens 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON public.teams 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
