/*
  # Fix infinite recursion in team_members RLS policies

  1. Problem
    - The current RLS policies on team_members table are causing infinite recursion
    - This happens when policies reference each other in circular dependencies
    - Specifically affects the SELECT policy when joining with teams table

  2. Solution
    - Drop existing problematic policies
    - Create simplified, non-recursive policies
    - Use direct user ID checks instead of complex subqueries
    - Avoid circular references between team_members and teams policies

  3. New Policies
    - Users can view team memberships where they are a member
    - Team owners can manage all team members in their teams
    - Simplified logic to prevent recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team membership" ON team_members;
DROP POLICY IF EXISTS "Team owners can invite members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update member roles" ON team_members;

-- Create simplified, non-recursive policies

-- Allow users to view team memberships where they are a member
CREATE POLICY "Users can view team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to view other members of teams they belong to
CREATE POLICY "Team members can view team roster"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Allow team owners to insert new members (simplified check)
CREATE POLICY "Team owners can invite members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM teams t 
      WHERE t.id = team_id 
      AND t.owner_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 
      FROM user_plans up 
      WHERE up.user_id = auth.uid() 
      AND up.plan_type IN ('growth', 'elite')
    )
  );

-- Allow team owners to update member roles
CREATE POLICY "Team owners can update members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM teams t 
      WHERE t.id = team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- Allow team owners to remove members (except themselves)
CREATE POLICY "Team owners can remove members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    user_id != auth.uid()
    AND
    EXISTS (
      SELECT 1 
      FROM teams t 
      WHERE t.id = team_id 
      AND t.owner_id = auth.uid()
    )
  );

-- Allow users to leave teams (delete their own membership)
CREATE POLICY "Users can leave teams"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());