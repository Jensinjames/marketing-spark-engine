
-- Remove the problematic foreign key constraint that creates circular dependency
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey1;

-- Fix the handle_new_user function to create records in the correct order
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- First, insert initial credits (this must come first)
  INSERT INTO public.user_credits (user_id, monthly_limit, credits_used)
  VALUES (NEW.id, 50, 0);
  
  -- Second, insert initial plan
  INSERT INTO public.user_plans (user_id, plan_type, credits)
  VALUES (NEW.id, 'starter', 50);
  
  -- Finally, insert profile (no longer depends on user_credits existing)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it to prevent user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
