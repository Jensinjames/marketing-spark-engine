
BEGIN;

-- Create user_role enum for global roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to profiles table with enum type
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'user';

-- Update existing users to have 'user' role by default
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Make role column NOT NULL
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Promote Jensin James to super_admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE id = '7b5d8565-2fc3-40f4-8c48-c68464ee40e0';

-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create comprehensive RLS policies for profiles with admin access
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update profiles" ON public.profiles
  FOR UPDATE 
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can delete profiles" ON public.profiles
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create index for performance on role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'
  );
$$;

-- Create helper function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super(user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Update audit logs policy to allow admins to view relevant logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Team admins can view team audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT 
  USING (
    public.is_admin_or_super() OR
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

-- Log the admin promotion for audit purposes
INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
VALUES (
  '7b5d8565-2fc3-40f4-8c48-c68464ee40e0',
  'user_promoted_to_super_admin',
  'profiles',
  '7b5d8565-2fc3-40f4-8c48-c68464ee40e0',
  jsonb_build_object('role', 'super_admin', 'promoted_at', now())
);

COMMIT;
