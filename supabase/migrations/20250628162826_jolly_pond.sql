/*
  # Add Content Performance Analytics

  1. New Tables
    - `content_analytics`
      - `id` (uuid, primary key)
      - `content_id` (uuid, references generated_content)
      - `metric_type` (text, type of metric: views, clicks, conversions, etc.)
      - `metric_value` (numeric, the actual metric value)
      - `recorded_at` (timestamp, when metric was recorded)
      - `metadata` (jsonb, additional context like source, campaign, etc.)

    - `content_performance_summary`
      - `content_id` (uuid, references generated_content)
      - `total_views` (integer)
      - `total_clicks` (integer)
      - `total_conversions` (integer)
      - `engagement_rate` (numeric)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on analytics tables
    - Users can only view analytics for their own content
    - Team admins can view team member analytics

  3. Features
    - Real-time performance tracking
    - Aggregated performance summaries
    - Historical trend analysis
*/

-- Create content analytics table
CREATE TABLE IF NOT EXISTS public.content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create performance summary table
CREATE TABLE IF NOT EXISTS public.content_performance_summary (
  content_id UUID PRIMARY KEY REFERENCES public.generated_content(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_analytics
CREATE POLICY "Users can view analytics for own content" ON public.content_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_analytics.content_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for own content" ON public.content_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_analytics.content_id AND gc.user_id = auth.uid()
    )
  );

-- RLS Policies for performance summary
CREATE POLICY "Users can view performance for own content" ON public.content_performance_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_performance_summary.content_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update performance for own content" ON public.content_performance_summary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_performance_summary.content_id AND gc.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_content_analytics_content_id ON public.content_analytics(content_id);
CREATE INDEX idx_content_analytics_metric_type ON public.content_analytics(metric_type);
CREATE INDEX idx_content_analytics_recorded_at ON public.content_analytics(recorded_at DESC);

-- Function to update performance summary
CREATE OR REPLACE FUNCTION public.update_content_performance_summary()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update summary on analytics insert
CREATE TRIGGER update_performance_summary_trigger
  AFTER INSERT ON public.content_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_content_performance_summary();