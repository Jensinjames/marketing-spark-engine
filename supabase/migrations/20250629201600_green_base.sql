/*
  # Verify Team Members RLS Fix

  This migration contains verification queries to ensure the RLS fix is working correctly.
  Run these queries manually in Supabase SQL editor to verify the fix.
*/

-- Test function to verify policies work without recursion
CREATE OR REPLACE FUNCTION test_team_members_rls_fix()
RETURNS TABLE(
  test_name text,
  status text,
  details text
)
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id uuid;
  test_team_id uuid;
  member_count integer;
  can_see_members boolean;
  has_plan boolean;
  is_owner boolean;
BEGIN
  -- Test 1: Verify helper functions work
  RETURN QUERY SELECT 
    'Helper Functions Test'::text,
    'CHECKING'::text,
    'Testing SECURITY DEFINER functions'::text;

  BEGIN
    -- Create test data
    test_user_id := gen_random_uuid();
    test_team_id := gen_random_uuid();
    
    -- Test is_team_owner_direct function
    SELECT is_team_owner_direct(test_team_id, test_user_id) INTO is_owner;
    
    RETURN QUERY SELECT 
      'is_team_owner_direct'::text,
      CASE WHEN is_owner IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::text,
      'Function executed without recursion'::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'is_team_owner_direct'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 2: Verify has_team_plan function
  BEGIN
    SELECT has_team_plan(test_user_id) INTO has_plan;
    
    RETURN QUERY SELECT 
      'has_team_plan'::text,
      CASE WHEN has_plan IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::text,
      'Function executed without recursion'::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'has_team_plan'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 3: Verify team_members table can be queried without recursion
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM team_members 
    WHERE team_id = test_team_id;
    
    RETURN QUERY SELECT 
      'team_members_query'::text,
      'PASS'::text,
      ('Successfully queried team_members table, count: ' || member_count::text)::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'team_members_query'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  -- Test 4: Verify policies exist
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'team_members'
    AND policyname LIKE 'team_members_%';
    
    RETURN QUERY SELECT 
      'policies_exist'::text,
      CASE WHEN member_count >= 5 THEN 'PASS' ELSE 'FAIL' END::text,
      ('Found ' || member_count::text || ' team_members policies')::text;
      
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'policies_exist'::text,
      'FAIL'::text,
      ('Exception: ' || SQLERRM)::text;
  END;

  RETURN QUERY SELECT 
    'Overall Test'::text,
    'COMPLETE'::text,
    'RLS fix verification completed'::text;
END;
$$;

-- Verification queries (run these manually in Supabase SQL editor)

-- 1. Check that all new policies are created
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename = 'team_members'
-- ORDER BY policyname;

-- 2. Check that helper functions exist
-- SELECT routine_name, routine_type, security_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN (
--   'is_team_owner_direct',
--   'has_team_plan', 
--   'is_team_member_direct',
--   'get_user_team_seats',
--   'get_team_member_count'
-- );

-- 3. Test that team_members can be queried without recursion
-- SELECT COUNT(*) as total_team_members FROM team_members;

-- 4. Run the comprehensive test function
-- SELECT * FROM test_team_members_rls_fix();

-- Clean up test function after verification
-- DROP FUNCTION IF EXISTS test_team_members_rls_fix();