/*
  # Add Advanced Team Management Features

  1. New Tables
    - `team_invitations`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `email` (text, invitee email)
      - `role` (team_role, proposed role)
      - `invited_by` (uuid, references auth.users)
      - `token` (text, unique invitation token)
      - `expires_at` (timestamp)
      - `status` (text, pending/accepted/expired/cancelled)
      - `created_at` (timestamp)

    - `team_activity_log`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references auth.users)
      - `action` (text, description of action)
      - `details` (jsonb, additional context)
      - `created_at` (timestamp)

  2. Enhanced Features
    - Invitation system with expiring tokens
    - Team activity tracking
    - Advanced team analytics
    - Team-wide credit pools

  3. Security
    - Secure invitation tokens
    - Activity logging for audit trails
    - Enhanced team permission system
*/

-- Create invitation status enum
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team activity log table
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invitations
CREATE POLICY "Team admins can manage invitations" ON public.team_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON public.team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policies for team_activity_log
CREATE POLICY "Team members can view activity log" ON public.team_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_activity_log.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_expires_at ON public.team_invitations(expires_at);
CREATE INDEX idx_team_activity_log_team_id ON public.team_activity_log(team_id);
CREATE INDEX idx_team_activity_log_created_at ON public.team_activity_log(created_at DESC);

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log team activity
CREATE OR REPLACE FUNCTION public.log_team_activity(
  p_team_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.team_activity_log (team_id, user_id, action, details)
  VALUES (p_team_id, auth.uid(), p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced team member policies with activity logging
CREATE OR REPLACE FUNCTION public.team_member_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_team_activity(
      NEW.team_id,
      'member_added',
      jsonb_build_object(
        'member_id', NEW.user_id,
        'role', NEW.role,
        'invited_by', NEW.invited_by
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role != NEW.role THEN
      PERFORM public.log_team_activity(
        NEW.team_id,
        'member_role_changed',
        jsonb_build_object(
          'member_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_team_activity(
      OLD.team_id,
      'member_removed',
      jsonb_build_object(
        'member_id', OLD.user_id,
        'role', OLD.role
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
CREATE TRIGGER team_member_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.team_member_change_trigger();

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record RECORD;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Find and validate invitation
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE token = invitation_token
    AND email = user_email
    AND status = 'pending'
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is already a team member
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = invitation_record.team_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a team member');
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role, invited_by, joined_at)
  VALUES (
    invitation_record.team_id,
    auth.uid(),
    invitation_record.role,
    invitation_record.invited_by,
    now()
  );
  
  -- Update invitation status
  UPDATE public.team_invitations
  SET status = 'accepted'
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object('success', true, 'team_id', invitation_record.team_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.team_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;