-- Enhanced Security System Migration
-- This migration adds comprehensive security tracking, device management, and audit logging

-- Security events table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  client_info JSONB,
  details JSONB,
  url TEXT,
  referrer TEXT,
  location_info JSONB, -- For geolocation data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User devices table for device tracking and management
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_info JSONB NOT NULL,
  is_trusted BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- User security settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_device_tracking BOOLEAN DEFAULT true,
  enable_location_tracking BOOLEAN DEFAULT false,
  enable_activity_logging BOOLEAN DEFAULT true,
  alert_on_new_device BOOLEAN DEFAULT true,
  alert_on_suspicious_activity BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 60, -- in minutes
  two_factor_enabled BOOLEAN DEFAULT false,
  backup_codes_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address INET,
  device_fingerprint TEXT,
  user_agent TEXT,
  attempt_count INTEGER DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suspicious activity patterns
CREATE TABLE IF NOT EXISTS public.suspicious_activity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'rapid_requests', 'unusual_locations', 'device_switching', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  ip_address INET,
  detection_data JSONB NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigated', 'false_positive', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Security notifications/alerts
CREATE TABLE IF NOT EXISTS public.security_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'new_device', 'suspicious_activity', 'rate_limit', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Performance indexes for security tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_action_created 
ON public.security_events(user_id, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_severity_created 
ON public.security_events(severity, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_device_fingerprint 
ON public.security_events(device_fingerprint, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip_address_created 
ON public.security_events(ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_devices_user_last_seen 
ON public.user_devices(user_id, last_seen DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_devices_fingerprint 
ON public.user_devices(device_fingerprint);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_failed_login_attempts_email_created 
ON public.failed_login_attempts(email, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_failed_login_attempts_ip_created 
ON public.failed_login_attempts(ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suspicious_activity_user_status 
ON public.suspicious_activity_patterns(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_notifications_user_unread 
ON public.security_notifications(user_id, is_read, created_at DESC);

-- Enhanced rate_limits table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_ip_action_window 
ON public.rate_limits(ip_address, action_type, window_start DESC) WHERE ip_address IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_user_action_window 
ON public.rate_limits(user_id, action_type, window_start DESC) WHERE user_id IS NOT NULL;

-- Functions for security operations

-- Function to log enhanced security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    action,
    severity,
    user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    p_severity,
    COALESCE(p_user_id, auth.uid()),
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update failed login attempts
CREATE OR REPLACE FUNCTION public.handle_failed_login_attempt(
  p_email TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  current_attempts INTEGER;
  lockout_duration INTERVAL := '15 minutes';
  max_attempts INTEGER := 5;
  result JSONB;
BEGIN
  -- Get current failed attempts
  SELECT attempt_count INTO current_attempts
  FROM public.failed_login_attempts
  WHERE email = p_email
    AND created_at > NOW() - lockout_duration;
  
  current_attempts := COALESCE(current_attempts, 0) + 1;
  
  -- Update or insert failed attempt record
  INSERT INTO public.failed_login_attempts (
    email,
    device_fingerprint,
    ip_address,
    user_agent,
    attempt_count,
    locked_until
  ) VALUES (
    p_email,
    p_device_fingerprint,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    current_attempts,
    CASE WHEN current_attempts >= max_attempts THEN NOW() + lockout_duration ELSE NULL END
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    attempt_count = current_attempts,
    locked_until = CASE WHEN current_attempts >= max_attempts THEN NOW() + lockout_duration ELSE NULL END,
    updated_at = NOW();
  
  -- Return lockout status
  result := jsonb_build_object(
    'attempts', current_attempts,
    'max_attempts', max_attempts,
    'locked', current_attempts >= max_attempts,
    'locked_until', CASE WHEN current_attempts >= max_attempts THEN NOW() + lockout_duration ELSE NULL END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear failed login attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(p_email TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM public.failed_login_attempts WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id UUID,
  p_action TEXT,
  p_threshold INTEGER DEFAULT 10,
  p_timeframe INTERVAL DEFAULT '10 minutes'
) RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
  is_suspicious BOOLEAN := false;
BEGIN
  -- Count recent similar actions
  SELECT COUNT(*) INTO recent_count
  FROM public.security_events
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - p_timeframe;
  
  IF recent_count >= p_threshold THEN
    is_suspicious := true;
    
    -- Log suspicious activity pattern
    INSERT INTO public.suspicious_activity_patterns (
      pattern_type,
      user_id,
      detection_data,
      risk_score
    ) VALUES (
      'rapid_action_repetition',
      p_user_id,
      jsonb_build_object(
        'action', p_action,
        'count', recent_count,
        'threshold', p_threshold,
        'timeframe', p_timeframe
      ),
      LEAST(100, (recent_count * 100 / p_threshold))
    );
  END IF;
  
  RETURN is_suspicious;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old security data
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void AS $$
BEGIN
  -- Clean up old security events (keep last 90 days)
  DELETE FROM public.security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up old failed login attempts (keep last 30 days)
  DELETE FROM public.failed_login_attempts 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up resolved suspicious activity patterns (keep last 30 days)
  DELETE FROM public.suspicious_activity_patterns 
  WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old rate limit records (keep last 24 hours)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  -- Clean up old device records that haven't been seen in 1 year
  DELETE FROM public.user_devices 
  WHERE last_seen < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user_devices last_seen on login
CREATE OR REPLACE FUNCTION public.update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from application logic when tracking device usage
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for security tables

-- Security events - users can only see their own events, admins see all
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security events" ON public.security_events
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Service role can manage security events" ON public.security_events
FOR ALL USING (auth.role() = 'service_role');

-- User devices - users can only see their own devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devices" ON public.user_devices
FOR ALL USING (user_id = auth.uid());

-- User security settings - users can only manage their own settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own security settings" ON public.user_security_settings
FOR ALL USING (user_id = auth.uid());

-- Failed login attempts - admin only
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view failed login attempts" ON public.failed_login_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Service role can manage failed login attempts" ON public.failed_login_attempts
FOR ALL USING (auth.role() = 'service_role');

-- Suspicious activity patterns - users can see their own, admins see all
ALTER TABLE public.suspicious_activity_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suspicious activity" ON public.suspicious_activity_patterns
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Security notifications - users can only see their own
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own security notifications" ON public.security_notifications
FOR ALL USING (user_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE public.security_events IS 'Comprehensive audit log for all security-related events';
COMMENT ON TABLE public.user_devices IS 'Tracks user devices for security monitoring and trusted device management';
COMMENT ON TABLE public.user_security_settings IS 'User-configurable security preferences and settings';
COMMENT ON TABLE public.failed_login_attempts IS 'Tracks failed login attempts for brute force protection';
COMMENT ON TABLE public.suspicious_activity_patterns IS 'Automated detection of suspicious user activity patterns';
COMMENT ON TABLE public.security_notifications IS 'Security alerts and notifications for users';

COMMENT ON FUNCTION public.log_security_event IS 'Centralized function for logging security events with automatic context';
COMMENT ON FUNCTION public.handle_failed_login_attempt IS 'Handles failed login attempt tracking and lockout logic';
COMMENT ON FUNCTION public.detect_suspicious_activity IS 'Automated suspicious activity pattern detection';
COMMENT ON FUNCTION public.cleanup_old_security_data IS 'Maintenance function to clean up old security data';