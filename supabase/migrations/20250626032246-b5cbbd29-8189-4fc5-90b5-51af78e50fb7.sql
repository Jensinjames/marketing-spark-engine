
-- Phase 1: Database Security Enhancements for Team Admin Dashboard

-- Add admin role to team_role enum if not exists
DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add admin-specific RLS policies for team data access
-- Allow team admins and owners to view all team member data including credits
CREATE POLICY "Team admins can view all team member data" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Allow team admins to view credit information for their team members
CREATE POLICY "Team admins can view team member credits" ON public.user_credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = user_credits.user_id
      AND EXISTS (
        SELECT 1 FROM public.team_members admin_tm
        WHERE admin_tm.team_id = tm.team_id
        AND admin_tm.user_id = auth.uid()
        AND admin_tm.role IN ('owner', 'admin')
      )
    )
  );

-- Allow team admins to view profiles of their team members
CREATE POLICY "Team admins can view team member profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = profiles.id
      AND EXISTS (
        SELECT 1 FROM public.team_members admin_tm
        WHERE admin_tm.team_id = tm.team_id
        AND admin_tm.user_id = auth.uid()
        AND admin_tm.role IN ('owner', 'admin')
      )
    )
  );

-- Create function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid 
    AND user_id = uid 
    AND role IN ('owner', 'admin')
  );
$$;

-- Update audit_logs policy to allow team admins to view their team's audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Team admins can view team audit logs" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND (
        audit_logs.user_id IN (
          SELECT user_id FROM public.team_members 
          WHERE team_id = tm.team_id
        )
      )
    )
  );
