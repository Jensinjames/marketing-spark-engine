/*
  # Fix Team Members RLS Infinite Recursion

  1. Problem Analysis
    - The "Team members can view team roster" policy in lucky_boat.sql creates infinite recursion
    - Policy queries team_members table while being applied to team_members table
    - Subquery in USING clause triggers the same policy repeatedly

  2. Solution
    - Drop all problematic policies from lucky_boat.sql
    - Use SECURITY DEFINER functions to bypass RLS for internal queries
    - Implement non-recursive policies using helper functions
    - Maintain all existing access control requirements

  3. Security
    - All helper functions use SECURITY DEFINER to prevent recursion
    - Policies maintain same access control intent
    - Added audit logging for policy changes
*/

-- Drop all existing problematic policies from lucky_boat.sql
DROP POLICY IF EXISTS "Users can view team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Team owners can invite members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Drop any other conflicting policies from previous migrations
DROP POLICY IF EXISTS "Users can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update member roles" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team membership" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_self_insert_policy" ON team_members;

-- Create or update helper functions with SECURITY DEFINER to prevent recursion
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

-- Create non-recursive policies using helper functions

-- Policy 1: Users can view team members if they are:
-- a) The member themselves, b) Team owner, or c) Active team member with proper plan
CREATE POLICY "team_members_select_policy" ON team_members
FOR SELECT USING (
  -- User can see their own membership record
  user_id = auth.uid()
  OR
  -- Team owner can see all members (uses helper function to avoid recursion)
  is_team_owner_direct(team_id, auth.uid())
  OR
  -- Active team members with proper plan can see other members (uses helper functions)
  (
    has_team_plan(auth.uid()) 
    AND is_team_member_direct(team_id, auth.uid())
  )
);

-- Policy 2: Only team owners can invite new members (with plan restrictions and seat limits)
CREATE POLICY "team_members_insert_policy" ON team_members
FOR INSERT WITH CHECK (
  -- Must be team owner (uses helper function)
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan (uses helper function)
  has_team_plan(auth.uid())
  AND
  -- Check team seat limits (uses helper function to prevent recursion)
  get_team_member_count(team_id) < get_user_team_seats(auth.uid())
);

-- Policy 3: Team owners can update member roles (except owner role)
CREATE POLICY "team_members_update_policy" ON team_members
FOR UPDATE USING (
  -- Must be team owner (uses helper function)
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan (uses helper function)
  has_team_plan(auth.uid())
  AND
  -- Cannot change owner role (only one owner per team)
  role != 'owner'
) WITH CHECK (
  -- Ensure updated role is not owner (only one owner per team)
  role != 'owner'
);

-- Policy 4: Team owners can remove members (except themselves and owner role)
CREATE POLICY "team_members_delete_policy" ON team_members
FOR DELETE USING (
  -- Must be team owner (uses helper function)
  is_team_owner_direct(team_id, auth.uid())
  AND
  -- Must have proper plan (uses helper function)
  has_team_plan(auth.uid())
  AND
  -- Cannot remove owner role
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
  -- Only when accepting a valid invitation (direct query to avoid recursion)
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

-- Policy 6: Users can leave teams (delete their own membership)
CREATE POLICY "team_members_self_delete_policy" ON team_members
FOR DELETE USING (
  -- User can only delete their own membership
  user_id = auth.uid()
  AND
  -- Cannot leave if they are the owner (must transfer ownership first)
  role != 'owner'
);

-- Create performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_status 
ON team_members(team_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_team_members_user_team 
ON team_members(user_id, team_id);

CREATE INDEX IF NOT EXISTS idx_teams_owner_id 
ON teams(owner_id);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_plan_type 
ON user_plans(user_id, plan_type);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_email_status 
ON team_invitations(team_id, email, status);

-- Add function comments for documentation
COMMENT ON FUNCTION is_team_owner_direct(uuid, uuid) IS 
'Check if user is team owner without causing policy recursion. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION has_team_plan(uuid) IS 
'Check if user has Growth or Elite plan for team features. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION is_team_member_direct(uuid, uuid) IS 
'Check if user is active team member without causing policy recursion. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_user_team_seats(uuid) IS 
'Get team seat limit for user from their plan. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_team_member_count(uuid) IS 
'Get active member count for a team without triggering policy recursion. Uses SECURITY DEFINER to bypass RLS.';

-- Log the policy fix for audit purposes
DO $$
BEGIN
  -- Insert audit log entry for the policy fix
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    old_values,
    new_values,
    created_at
  ) VALUES (
    NULL, -- System action
    'fix_team_members_rls_recursion',
    'team_members',
    jsonb_build_object(
      'issue', 'infinite_recursion_in_policies',
      'problematic_policies', ARRAY[
        'Team members can view team roster',
        'Users can view team memberships'
      ]
    ),
    jsonb_build_object(
      'solution', 'security_definer_functions',
      'new_policies', ARRAY[
        'team_members_select_policy',
        'team_members_insert_policy', 
        'team_members_update_policy',
        'team_members_delete_policy',
        'team_members_self_insert_policy',
        'team_members_self_delete_policy'
      ],
      'helper_functions', ARRAY[
        'is_team_owner_direct',
        'has_team_plan',
        'is_team_member_direct',
        'get_user_team_seats',
        'get_team_member_count'
      ]
    ),
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  -- If audit_logs table doesn't exist or has different structure, continue silently
  NULL;
END $$;