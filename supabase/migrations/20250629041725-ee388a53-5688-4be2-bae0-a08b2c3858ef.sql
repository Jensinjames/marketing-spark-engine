
-- Fix High-Priority Security Functions
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(p_action text, p_table_name text, p_record_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid 
    AND user_id = uid 
    AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner(team_uuid uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_uuid AND owner_id = uid
  );
$$;

-- Fix Data Modification Functions
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used = 0,
    reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE reset_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_monthly_credits_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.reset_at <= now() THEN
    NEW.credits_used = 0;
    NEW.reset_at = date_trunc('month', now()) + interval '1 month';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_team_activity(p_team_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_activity_log (team_id, user_id, action, details)
  VALUES (p_team_id, auth.uid(), p_action, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_user_activity(p_action text, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.team_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.create_content_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.content_versions (
      content_id,
      version_number,
      content_data,
      created_by,
      change_summary
    )
    SELECT 
      NEW.id,
      COALESCE(MAX(version_number), 0) + 1,
      OLD.content,
      auth.uid(),
      'Auto-saved version'
    FROM public.content_versions
    WHERE content_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_content_performance_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_performance_summary (
    content_id,
    total_views,
    total_clicks,
    total_conversions,
    engagement_rate,
    last_updated
  )
  SELECT 
    NEW.content_id,
    COALESCE(SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN metric_type = 'clicks' THEN metric_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN metric_type = 'conversions' THEN metric_value ELSE 0 END), 0),
    CASE 
      WHEN SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END) > 0 
      THEN (SUM(CASE WHEN metric_type = 'clicks' THEN metric_value ELSE 0 END) / 
            SUM(CASE WHEN metric_type = 'views' THEN metric_value ELSE 0 END)) * 100
      ELSE 0 
    END,
    now()
  FROM public.content_analytics
  WHERE content_id = NEW.content_id
  ON CONFLICT (content_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_clicks = EXCLUDED.total_clicks,
    total_conversions = EXCLUDED.total_conversions,
    engagement_rate = EXCLUDED.engagement_rate,
    last_updated = EXCLUDED.last_updated;
    
  RETURN NEW;
END;
$$;

-- Fix Utility and Read Functions
CREATE OR REPLACE FUNCTION public.get_user_plan_info(check_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(plan_type text, credits integer, team_seats integer, can_manage_teams boolean)
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    up.plan_type::text,
    up.credits,
    up.team_seats,
    (up.plan_type IN ('growth', 'elite'))::boolean as can_manage_teams
  FROM public.user_plans up
  WHERE up.user_id = check_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_recommendations(limit_count integer DEFAULT 10)
RETURNS TABLE(content_id uuid, title text, type content_type, score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_activity AS (
    SELECT 
      resource_id,
      COUNT(*) as interaction_count,
      MAX(created_at) as last_interaction
    FROM public.user_activity_log
    WHERE user_id = auth.uid()
      AND resource_type = 'content'
      AND action IN ('view', 'edit', 'copy')
    GROUP BY resource_id
  ),
  content_scores AS (
    SELECT 
      gc.id,
      gc.title,
      gc.type,
      COALESCE(ua.interaction_count, 0) * 0.3 +
      COALESCE(cps.total_views, 0) * 0.0001 +
      CASE WHEN gc.is_favorite THEN 10 ELSE 0 END +
      CASE WHEN gc.created_at > now() - interval '30 days' THEN 5 ELSE 0 END as score
    FROM public.generated_content gc
    LEFT JOIN user_activity ua ON ua.resource_id = gc.id
    LEFT JOIN public.content_performance_summary cps ON cps.content_id = gc.id
    WHERE gc.user_id = auth.uid()
  )
  SELECT cs.id, cs.title, cs.type, cs.score
  FROM content_scores cs
  ORDER BY cs.score DESC, random()
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_feature(feature_name text, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE 
    WHEN feature_name = 'integrations' THEN
      EXISTS (
        SELECT 1 FROM public.user_plans 
        WHERE user_id = check_user_id 
        AND plan_type IN ('growth', 'elite')
      )
    ELSE true
  END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_user_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_member_change_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
