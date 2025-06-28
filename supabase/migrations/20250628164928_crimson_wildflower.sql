-- First, ensure all tables have RLS enabled (some may already be enabled)
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to recreate them properly
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies on user_plans
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_plans' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_plans';
    END LOOP;
    
    -- Drop all policies on user_credits
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_credits' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_credits';
    END LOOP;
    
    -- Drop all policies on generated_content
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'generated_content' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.generated_content';
    END LOOP;
    
    -- Drop all policies on integration_tokens
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'integration_tokens' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.integration_tokens';
    END LOOP;
    
    -- Drop all policies on teams
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'teams' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.teams';
    END LOOP;
    
    -- Drop all policies on team_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'team_members' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.team_members';
    END LOOP;
    
    -- Drop all policies on audit_logs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs' AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.audit_logs';
        END LOOP;
    END IF;
END $$;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
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

-- Create helper function for team ownership checks
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

-- Create function to check feature access based on plan
CREATE OR REPLACE FUNCTION public.can_access_feature(feature_name text, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN feature_name = 'integrations' THEN
      EXISTS (
        SELECT 1 FROM public.user_plans 
        WHERE user_id = check_user_id 
        AND plan_type IN ('growth', 'elite')
      )
    ELSE true
  END;
$$;

-- Create function to get user plan info
CREATE OR REPLACE FUNCTION public.get_user_plan_info(check_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  plan_type text,
  credits integer,
  team_seats integer,
  can_manage_teams boolean
)
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT 
    up.plan_type::text,
    up.credits,
    up.team_seats,
    (up.plan_type IN ('growth', 'elite'))::boolean as can_manage_teams
  FROM public.user_plans up
  WHERE up.user_id = check_user_id;
$$;

-- Create comprehensive RLS policies for integration_tokens
CREATE POLICY "Users can view own integrations" ON public.integration_tokens
  FOR SELECT USING (auth.uid() = user_id AND can_access_feature('integrations'));

CREATE POLICY "Users can insert own integrations" ON public.integration_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id AND can_access_feature('integrations'));

CREATE POLICY "Users can update own integrations" ON public.integration_tokens
  FOR UPDATE USING (auth.uid() = user_id AND can_access_feature('integrations'));

CREATE POLICY "Users can delete own integrations" ON public.integration_tokens
  FOR DELETE USING (auth.uid() = user_id AND can_access_feature('integrations'));

-- Create simplified team RLS policies
CREATE POLICY "Team owners can delete teams" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can update teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.user_plans 
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

-- Create team member policies
CREATE POLICY "Users can view their team members" ON public.team_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_owner(team_id) OR
    EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.user_plans 
        WHERE user_id = auth.uid() 
        AND plan_type IN ('growth', 'elite')
      )
    )
  );

CREATE POLICY "Team owners can invite members" ON public.team_members
  FOR INSERT WITH CHECK (
    is_owner(team_id) AND
    EXISTS (
      SELECT 1 FROM public.user_plans 
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    ) AND
    (
      SELECT COUNT(*) FROM public.team_members 
      WHERE team_id = team_members.team_id
    ) < (
      SELECT team_seats FROM public.user_plans 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can remove members" ON public.team_members
  FOR DELETE USING (
    is_owner(team_id) AND 
    role != 'owner' AND
    EXISTS (
      SELECT 1 FROM public.user_plans 
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

CREATE POLICY "Team owners can update member roles" ON public.team_members
  FOR UPDATE USING (
    is_owner(team_id) AND
    EXISTS (
      SELECT 1 FROM public.user_plans 
      WHERE user_id = auth.uid() 
      AND plan_type IN ('growth', 'elite')
    )
  );

CREATE POLICY "Users can insert own team membership" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add database-level validation constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add constraints for user_credits
    BEGIN
        ALTER TABLE public.user_credits ADD CONSTRAINT credits_used_non_negative CHECK (credits_used >= 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.user_credits ADD CONSTRAINT monthly_limit_positive CHECK (monthly_limit > 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.user_credits ADD CONSTRAINT credits_within_limit CHECK (credits_used <= monthly_limit * 2);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Add constraints for user_plans
    BEGIN
        ALTER TABLE public.user_plans ADD CONSTRAINT credits_positive CHECK (credits > 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.user_plans ADD CONSTRAINT team_seats_positive CHECK (team_seats > 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add NOT NULL constraints for critical security fields (only if not already set)
DO $$
BEGIN
    -- Check and set NOT NULL constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_content' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.generated_content ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.user_credits ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_plans' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.user_plans ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_tokens' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.integration_tokens ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_members' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.team_members ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' 
        AND column_name = 'owner_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.teams ALTER COLUMN owner_id SET NOT NULL;
    END IF;
END $$;

-- Create audit log table for sensitive operations (only if it doesn't exist)
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

-- Add updated_at triggers to all tables that have the column (only if they don't exist)
DO $$
BEGIN
    -- Check and create triggers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at 
          BEFORE UPDATE ON public.profiles 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_plans_updated_at'
    ) THEN
        CREATE TRIGGER update_user_plans_updated_at 
          BEFORE UPDATE ON public.user_plans 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_credits_updated_at'
    ) THEN
        CREATE TRIGGER update_user_credits_updated_at 
          BEFORE UPDATE ON public.user_credits 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_generated_content_updated_at'
    ) THEN
        CREATE TRIGGER update_generated_content_updated_at 
          BEFORE UPDATE ON public.generated_content 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_integration_tokens_updated_at'
    ) THEN
        CREATE TRIGGER update_integration_tokens_updated_at 
          BEFORE UPDATE ON public.integration_tokens 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_teams_updated_at'
    ) THEN
        CREATE TRIGGER update_teams_updated_at 
          BEFORE UPDATE ON public.teams 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Handle the reset_monthly_credits function and trigger conflicts properly
-- First drop the trigger if it exists, then the function, then recreate both

DO $$
BEGIN
    -- Drop trigger first if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'reset_monthly_credits_trigger'
        AND event_object_table = 'user_credits'
    ) THEN
        DROP TRIGGER reset_monthly_credits_trigger ON public.user_credits;
    END IF;
    
    -- Now we can safely drop the function
    DROP FUNCTION IF EXISTS public.reset_monthly_credits() CASCADE;
END $$;

-- Create function to reset monthly credits (for automated workflows)
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used = 0,
    reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE reset_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for automatic credit reset
CREATE OR REPLACE FUNCTION public.reset_monthly_credits_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reset_at <= now() THEN
    NEW.credits_used = 0;
    NEW.reset_at = date_trunc('month', now()) + interval '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic credit reset
CREATE TRIGGER reset_monthly_credits_trigger
  AFTER INSERT OR UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_monthly_credits_trigger();