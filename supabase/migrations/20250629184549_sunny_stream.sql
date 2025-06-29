/*
  # Test Team Policies for Recursion Issues

  This migration includes test queries to verify that the new policies
  don't cause infinite recursion and work as expected.
*/

-- Test function to verify policies work without recursion
CREATE OR REPLACE FUNCTION test_team_policies()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  test_result text := 'PASS';
  test_user_id uuid;
  test_team_id uuid;
  member_count integer;
BEGIN
  -- Create test data
  INSERT INTO profiles (id, email, full_name, role) 
  VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'user')
  RETURNING id INTO test_user_id;
  
  INSERT INTO user_plans (user_id, plan_type, team_seats)
  VALUES (test_user_id, 'growth', 5);
  
  INSERT INTO teams (id, name, owner_id)
  VALUES (gen_random_uuid(), 'Test Team', test_user_id)
  RETURNING id INTO test_team_id;
  
  -- Test 1: Check if owner can see team members
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM team_members 
    WHERE team_id = test_team_id;
    
    IF member_count IS NULL THEN
      test_result := 'FAIL: Could not query team_members';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_result := 'FAIL: Exception in team_members query - ' || SQLERRM;
  END;
  
  -- Test 2: Check helper functions
  BEGIN
    IF NOT is_team_owner_direct(test_team_id, test_user_id) THEN
      test_result := 'FAIL: is_team_owner_direct not working';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_result := 'FAIL: Exception in is_team_owner_direct - ' || SQLERRM;
  END;
  
  -- Test 3: Check plan function
  BEGIN
    IF NOT has_team_plan(test_user_id) THEN
      test_result := 'FAIL: has_team_plan not working';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_result := 'FAIL: Exception in has_team_plan - ' || SQLERRM;
  END;
  
  -- Cleanup test data
  DELETE FROM teams WHERE id = test_team_id;
  DELETE FROM user_plans WHERE user_id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
  
  RETURN test_result;
END;
$$;

-- Run the test (comment out in production)
-- SELECT test_team_policies();

-- Drop test function after use
-- DROP FUNCTION test_team_policies();