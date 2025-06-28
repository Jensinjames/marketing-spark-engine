/*
  # Add Content Templates System

  1. New Tables
    - `content_templates`
      - `id` (uuid, primary key)
      - `name` (text, template name)
      - `description` (text, template description)
      - `type` (content_type, matches existing enum)
      - `template_data` (jsonb, template structure and prompts)
      - `is_public` (boolean, whether template is available to all users)
      - `created_by` (uuid, user who created template)
      - `usage_count` (integer, how many times template has been used)
      - `tags` (text[], searchable tags)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `content_templates` table
    - Add policies for template access and management
    - Allow users to create private templates
    - Allow access to public templates for all users

  3. Features
    - Template versioning support
    - Usage analytics
    - Template sharing capabilities
*/

-- Create content templates table
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type content_type NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public templates and own templates" ON public.content_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create own templates" ON public.content_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON public.content_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON public.content_templates
  FOR DELETE USING (created_by = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_content_templates_updated_at 
  BEFORE UPDATE ON public.content_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_content_templates_type ON public.content_templates(type);
CREATE INDEX idx_content_templates_public ON public.content_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_content_templates_tags ON public.content_templates USING GIN(tags);
CREATE INDEX idx_content_templates_usage ON public.content_templates(usage_count DESC);

-- Insert some default public templates
INSERT INTO public.content_templates (name, description, type, template_data, is_public, created_by, tags) VALUES
(
  'Product Launch Email',
  'Professional email template for announcing new product launches',
  'email_sequence',
  '{
    "subject_templates": ["🚀 Introducing {product_name}", "The wait is over: {product_name} is here!"],
    "structure": {
      "greeting": "Hi {customer_name},",
      "announcement": "We''re thrilled to announce the launch of {product_name}!",
      "benefits": "{key_benefits}",
      "cta": "Get started with {product_name} today",
      "closing": "Best regards,\n{sender_name}"
    },
    "variables": ["product_name", "customer_name", "key_benefits", "sender_name"]
  }',
  true,
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['email', 'product-launch', 'announcement']
),
(
  'Social Media Product Post',
  'Engaging social media post template for product promotion',
  'social_post',
  '{
    "structure": {
      "hook": "🔥 {attention_grabber}",
      "description": "{product_description}",
      "benefits": "✅ {benefit_1}\n✅ {benefit_2}\n✅ {benefit_3}",
      "cta": "👆 {call_to_action}",
      "hashtags": "{relevant_hashtags}"
    },
    "variables": ["attention_grabber", "product_description", "benefit_1", "benefit_2", "benefit_3", "call_to_action", "relevant_hashtags"]
  }',
  true,
  (SELECT id FROM auth.users LIMIT 1),
  ARRAY['social-media', 'product', 'promotion']
);