-- Email Delivery System Enhancement
-- This migration adds comprehensive email delivery tracking, retry mechanisms, and monitoring

-- Email delivery tracking table
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES public.team_invitations(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'team_invitation', -- team_invitation, notification, etc.
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'unsubscribed')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  provider_response JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT
);

-- Rate limiting for server-side email protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  action_type TEXT NOT NULL, -- send_invitation, resend_email, etc.
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(COALESCE(user_id::text, ''), COALESCE(ip_address::text, ''), action_type)
);

-- Email unsubscribe tracking
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribe_token TEXT UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for email system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_delivery_logs_invitation_id 
ON public.email_delivery_logs(invitation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_delivery_logs_status_retry 
ON public.email_delivery_logs(status, next_retry_at) 
WHERE status IN ('failed', 'queued') AND next_retry_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_delivery_logs_recipient_type 
ON public.email_delivery_logs(recipient_email, email_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_user_action_window 
ON public.rate_limits(user_id, action_type, window_start);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_ip_action_window 
ON public.rate_limits(ip_address, action_type, window_start);

-- Enhanced team_invitations indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_invitations_email_status_expires 
ON public.team_invitations(email, status, expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_invitations_token_status 
ON public.team_invitations(token, status);

-- Function to update email delivery log timestamps
CREATE OR REPLACE FUNCTION public.update_email_delivery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set delivered_at when status changes to delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  -- Set bounced_at when status changes to bounced
  IF NEW.status = 'bounced' AND OLD.status != 'bounced' THEN
    NEW.bounced_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for email delivery log updates
DROP TRIGGER IF EXISTS trigger_update_email_delivery_timestamp ON public.email_delivery_logs;
CREATE TRIGGER trigger_update_email_delivery_timestamp
  BEFORE UPDATE ON public.email_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_delivery_timestamp();

-- Function to clean up old rate limiting records
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get failed emails for retry
CREATE OR REPLACE FUNCTION public.get_failed_emails_for_retry()
RETURNS TABLE(
  log_id UUID,
  invitation_id UUID,
  recipient_email TEXT,
  email_type TEXT,
  retry_count INTEGER,
  max_retries INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    edl.id,
    edl.invitation_id,
    edl.recipient_email,
    edl.email_type,
    edl.retry_count,
    edl.max_retries
  FROM public.email_delivery_logs edl
  WHERE edl.status = 'failed'
    AND edl.retry_count < edl.max_retries
    AND (edl.next_retry_at IS NULL OR edl.next_retry_at <= NOW())
    AND edl.created_at > NOW() - INTERVAL '24 hours'; -- Don't retry emails older than 24 hours
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for email delivery logs
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email logs for their teams" ON public.email_delivery_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_invitations ti
    JOIN public.team_members tm ON ti.team_id = tm.team_id
    WHERE ti.id = email_delivery_logs.invitation_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
  )
);

-- RLS Policies for rate limits (admin only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage rate limits" ON public.rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for email unsubscribes (admin only for viewing)
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view unsubscribes" ON public.email_unsubscribes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION public.generate_unsubscribe_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(gen_random_uuid()::text || extract(epoch from now())::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.email_delivery_logs IS 'Tracks all email delivery attempts, retries, and status updates';
COMMENT ON TABLE public.rate_limits IS 'Server-side rate limiting for email and API operations';
COMMENT ON TABLE public.email_unsubscribes IS 'Tracks email unsubscription requests for compliance';
COMMENT ON FUNCTION public.cleanup_expired_rate_limits() IS 'Maintenance function to clean up old rate limiting records';
COMMENT ON FUNCTION public.get_failed_emails_for_retry() IS 'Returns failed emails that are eligible for retry';