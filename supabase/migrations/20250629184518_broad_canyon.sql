/*
  # Fix Team Members Policy Recursion Issues

  This migration addresses infinite recursion in team_members policies by:
  1. Simplifying policy logic to avoid self-referencing queries
  2. Using direct foreign key relationships instead of complex subqueries
  3. Creating helper functions that don't cause circular dependencies
  4. Implementing proper termination conditions

  ## Changes Made:
  - Drop existing problematic policies
  - Create new optimized policies with clear termination conditions
  - Add helper functions for team access control
  - Ensure backward compatibility with existing access patterns
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can invite members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update member roles" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team membership" ON team_members;

-- Create helper function to check team ownership without recursion
CREATE OR REPLACE FUNCTION is_team_owner_direct(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_uuid 
    AND teams.owner_id = user_uuid
  );
$$;

-- Create helper function to check if user has required plan
CREATE OR REPLACE FUNCTION has_team_plan(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plans 
    WHERE user_plans.user_id = user_uuid 
    AND user_plans.plan_type = ANY (ARRAY['growth'::plan_type, 'elite'::plan_type])
  );
$$;

-- Create helper function to check team membership without recursion
CREATE OR REPLACE FUNCTION is_team_member_direct(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.team_id = team_uuid 
    AND team_members.user_id = user_uuid 
    AND team_members.status = 'active'
  );
$$;

-- Policy 1: Users can view team members if they are:
-- a) The member themselves, b) Team owner, or c) Active team member with proper plan
CREATE POLICY "team_members_select_policy" ON team_members
FOR SELECT USING (
  -- User can see their own membership record
  user_id = auth.uid()
  OR
  -- Team owner can see all members
  is_team_owner_direct(team_id, auth.uid())
  OR
  -- Active team members with proper plan can see other members
  (
    has_team_plan(auth.uid()) 
    AND is_team_member_direct(team_id, auth.uid())
  )
);

-- Policy 2: Only team owners can invite new members (with plan restrictions)
CREATE POLICY "team_members_insert_policy" ON team_members
FOR INSERT WITH CHECK (
  -- Must be team owner
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan
  has_team_plan(auth.uid())
  AND
  -- Check team seat limits (prevent over-allocation)
  (
    SELECT COUNT(*) FROM team_members 
    WHERE team_members.team_id = team_id
  ) < (
    SELECT user_plans.team_seats 
    FROM user_plans 
    WHERE user_plans.user_id = auth.uid()
  )
);

-- Policy 3: Team owners can update member roles (except owner role)
CREATE POLICY "team_members_update_policy" ON team_members
FOR UPDATE USING (
  -- Must be team owner
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan
  has_team_plan(auth.uid())
  AND
  -- Cannot change owner role
  role != 'owner'
) WITH CHECK (
  -- Ensure updated role is not owner (only one owner per team)
  role != 'owner'
);

-- Policy 4: Team owners can remove members (except themselves)
CREATE POLICY "team_members_delete_policy" ON team_members
FOR DELETE USING (
  -- Must be team owner
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan
  has_team_plan(auth.uid())
  AND
  -- Cannot remove owner (themselves)
  role != 'owner'
  AND
  -- Additional safety: cannot remove self
  user_id != auth.uid()
);

-- Policy 5: Users can insert their own membership when accepting invitations
CREATE POLICY "team_members_self_insert_policy" ON team_members
FOR INSERT WITH CHECK (
  -- User can only insert their own membership
  user_id = auth.uid()
  AND
  -- Only when accepting a valid invitation
  EXISTS (
    SELECT 1 FROM team_invitations 
    WHERE team_invitations.team_id = team_id
    AND team_invitations.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    AND team_invitations.status = 'pending'
    AND team_invitations.expires_at > NOW()
  )
);

-- Create index to optimize policy performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_status 
ON team_members(team_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_team_members_user_team 
ON team_members(user_id, team_id);

-- Add comments for documentation
COMMENT ON FUNCTION is_team_owner_direct(uuid, uuid) IS 
'Check if user is team owner without causing policy recursion';

COMMENT ON FUNCTION has_team_plan(uuid) IS 
'Check if user has Growth or Elite plan for team features';

COMMENT ON FUNCTION is_team_member_direct(uuid, uuid) IS 
'Check if user is active team member without causing policy recursion';