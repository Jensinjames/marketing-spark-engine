/*
  # Add min_plan_type column to content_templates table

  1. Schema Changes
    - Add `min_plan_type` column to `content_templates` table
    - Set default value to 'starter' to ensure backward compatibility
    - Add index for efficient querying by plan type

  2. Data Migration
    - All existing templates will default to 'starter' plan access
    - This ensures no breaking changes for existing users

  3. Security
    - Update RLS policies to respect plan-based access control
    - Ensure users can only access templates for their plan level or below
*/

-- Add min_plan_type column to content_templates table
ALTER TABLE content_templates 
ADD COLUMN IF NOT EXISTS min_plan_type plan_type DEFAULT 'starter'::plan_type NOT NULL;

-- Add index for efficient querying by plan type
CREATE INDEX IF NOT EXISTS idx_content_templates_min_plan_type 
ON content_templates (min_plan_type);

-- Add composite index for type and plan filtering
CREATE INDEX IF NOT EXISTS idx_content_templates_type_plan 
ON content_templates (type, min_plan_type);

-- Create a function to check if user can access template based on plan
CREATE OR REPLACE FUNCTION can_access_template(template_plan_type plan_type, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN template_plan_type = 'starter' THEN true
    WHEN template_plan_type = 'pro' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type IN ('pro', 'growth', 'elite')
      )
    WHEN template_plan_type = 'growth' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type IN ('growth', 'elite')
      )
    WHEN template_plan_type = 'elite' THEN 
      EXISTS (
        SELECT 1 FROM user_plans up 
        WHERE up.user_id = COALESCE(user_id, auth.uid())
        AND up.plan_type = 'elite'
      )
    ELSE false
  END;
$$;

-- Update the existing RLS policy for content_templates to include plan-based access
DROP POLICY IF EXISTS "Users can view public templates and own templates" ON content_templates;

CREATE POLICY "Users can view accessible templates"
  ON content_templates
  FOR SELECT
  TO public
  USING (
    (is_public = true AND can_access_template(min_plan_type, auth.uid())) 
    OR (created_by = auth.uid())
  );

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION can_access_template(plan_type, uuid) TO authenticated, public;

-- Add some sample premium templates for different plan tiers
INSERT INTO content_templates (name, description, type, template_data, is_public, created_by, min_plan_type, tags)
VALUES 
  (
    'Advanced Email Sequence Template',
    'Professional email sequence with advanced personalization and A/B testing elements',
    'email_sequence',
    '{"subject_lines": ["{{first_name}}, exclusive offer inside", "Last chance: {{offer_name}}"], "personalization": true, "ab_testing": true}',
    true,
    (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1),
    'pro',
    ARRAY['email', 'advanced', 'personalization']
  ),
  (
    'Growth Marketing Funnel',
    'Complete growth marketing funnel with advanced analytics and conversion optimization',
    'funnel',
    '{"stages": ["awareness", "consideration", "conversion", "retention"], "analytics": true, "optimization": true}',
    true,
    (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1),
    'growth',
    ARRAY['funnel', 'growth', 'analytics']
  ),
  (
    'Enterprise Strategy Brief',
    'Comprehensive strategy brief template for enterprise-level campaigns',
    'strategy_brief',
    '{"sections": ["executive_summary", "market_analysis", "competitive_landscape", "strategy", "implementation"], "enterprise_features": true}',
    true,
    (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1),
    'elite',
    ARRAY['strategy', 'enterprise', 'comprehensive']
  )
ON CONFLICT DO NOTHING;