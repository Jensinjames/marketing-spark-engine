/*
  # Update Team-Related Functions to Prevent Recursion

  This migration updates existing team-related functions to work with
  the new non-recursive policies and ensures they don't cause circular
  dependencies.
*/

-- Update the existing is_owner function to use direct table access
CREATE OR REPLACE FUNCTION is_owner(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use direct teams table lookup instead of team_members
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_uuid 
    AND teams.owner_id = uid
  );
$$;

-- Update is_team_admin to avoid recursion
CREATE OR REPLACE FUNCTION is_team_admin(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    -- Check if user is team owner via teams table
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_uuid 
      AND teams.owner_id = uid
    )
    OR
    -- Check if user is admin member via direct query
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_uuid 
      AND team_members.user_id = uid 
      AND team_members.role = 'admin'
      AND team_members.status = 'active'
    );
$$;

-- Create function to safely check team membership count
CREATE OR REPLACE FUNCTION get_team_member_count(team_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer 
  FROM team_members 
  WHERE team_id = team_uuid 
  AND status = 'active';
$$;

-- Create function to get user's team seat limit
CREATE OR REPLACE FUNCTION get_user_team_seats(user_uuid uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(user_plans.team_seats, 1)
  FROM user_plans 
  WHERE user_plans.user_id = user_uuid;
$$;

-- Add performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_plan_type ON user_plans(user_id, plan_type);

-- Add function comments
COMMENT ON FUNCTION get_team_member_count(uuid) IS 
'Get active member count for a team without triggering policy recursion';

COMMENT ON FUNCTION get_user_team_seats(uuid) IS 
'Get team seat limit for user from their plan';