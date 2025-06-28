/*
  # Add Enhanced User Experience Features

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, primary key, references auth.users)
      - `theme` (text, light/dark/auto)
      - `language` (text, user's preferred language)
      - `timezone` (text, user's timezone)
      - `email_notifications` (jsonb, notification preferences)
      - `default_content_settings` (jsonb, default settings for content generation)
      - `updated_at` (timestamp)

    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `item_type` (text, content/template/etc.)
      - `item_id` (uuid, the favorited item)
      - `created_at` (timestamp)

    - `user_activity_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `action` (text, action performed)
      - `resource_type` (text, type of resource)
      - `resource_id` (uuid, resource identifier)
      - `metadata` (jsonb, additional context)
      - `created_at` (timestamp)

  2. Enhanced Features
    - Personalized user preferences
    - Favorites system
    - Activity tracking for better UX
    - Smart recommendations based on usage

  3. Security
    - User-specific data isolation
    - Privacy-compliant activity logging
*/

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  email_notifications JSONB DEFAULT '{
    "content_ready": true,
    "credit_alerts": true,
    "weekly_summary": false,
    "team_invitations": true,
    "collaboration_updates": true
  }',
  default_content_settings JSONB DEFAULT '{
    "tone": "professional",
    "length": "medium",
    "include_emojis": false,
    "target_audience": "general"
  }',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('content', 'template', 'team')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_favorites
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can log user activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_type ON public.user_favorites(item_type);
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_action ON public.user_activity_log(action);

-- Add updated_at trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION public.create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_preferences();

-- Function to get user's content recommendations
CREATE OR REPLACE FUNCTION public.get_user_recommendations(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  content_id UUID,
  title TEXT,
  type content_type,
  score NUMERIC
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial credits (this must come first)
  INSERT INTO public.user_credits (user_id, monthly_limit, credits_used)
  VALUES (NEW.id, 50, 0);
  
  -- Insert initial plan
  INSERT INTO public.user_plans (user_id, plan_type, credits)
  VALUES (NEW.id, 'starter', 50);
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Insert default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Log user registration
  INSERT INTO public.user_activity_log (user_id, action, metadata)
  VALUES (NEW.id, 'user_registered', jsonb_build_object('registration_date', now()));
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';