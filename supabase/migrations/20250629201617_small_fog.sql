/*
  # Cleanup Old Problematic Policies

  This migration ensures all old problematic policies are completely removed
  and provides a clean slate for the new RLS implementation.
*/

-- Remove any remaining problematic policies that might cause conflicts
DROP POLICY IF EXISTS "Users can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can invite members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update member roles" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team membership" ON team_members;
DROP POLICY IF EXISTS "Users can view team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Also clean up any policies from the authenticated role that might conflict
DROP POLICY IF EXISTS "Team members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Team owners can invite members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Remove old helper functions that might have different signatures
DROP FUNCTION IF EXISTS is_owner(uuid, uuid);
DROP FUNCTION IF EXISTS is_team_admin(uuid, uuid);

-- Recreate the updated helper functions to ensure they have the correct implementation
CREATE OR REPLACE FUNCTION is_owner(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use direct teams table lookup instead of team_members to avoid recursion
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_uuid 
    AND teams.owner_id = uid
  );
$$;

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

-- Ensure RLS is enabled on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Log the cleanup action
DO $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    new_values,
    created_at
  ) VALUES (
    NULL, -- System action
    'cleanup_old_team_policies',
    'team_members',
    jsonb_build_object(
      'action', 'removed_all_old_problematic_policies',
      'reason', 'prevent_rls_recursion_conflicts',
      'timestamp', NOW()
    ),
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  -- Continue silently if audit_logs doesn't exist
  NULL;
END $$;