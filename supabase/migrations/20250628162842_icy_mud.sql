/*
  # Add Advanced Collaboration Features

  1. New Tables
    - `content_collaborations`
      - `id` (uuid, primary key)
      - `content_id` (uuid, references generated_content)
      - `collaborator_id` (uuid, references auth.users)
      - `permission_level` (text, view/edit/admin)
      - `invited_by` (uuid, references auth.users)
      - `status` (text, pending/accepted/declined)
      - `created_at` (timestamp)

    - `content_comments`
      - `id` (uuid, primary key)
      - `content_id` (uuid, references generated_content)
      - `user_id` (uuid, references auth.users)
      - `comment_text` (text)
      - `parent_comment_id` (uuid, for threaded comments)
      - `is_resolved` (boolean)
      - `created_at` (timestamp)

    - `content_versions`
      - `id` (uuid, primary key)
      - `content_id` (uuid, references generated_content)
      - `version_number` (integer)
      - `content_data` (jsonb, snapshot of content at this version)
      - `created_by` (uuid, references auth.users)
      - `change_summary` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all collaboration tables
    - Proper access controls for collaborators
    - Version history protection

  3. Features
    - Real-time collaboration
    - Comment system with threading
    - Version control and history
    - Permission management
*/

-- Create collaboration permission enum
DO $$ BEGIN
    CREATE TYPE collaboration_permission AS ENUM ('view', 'edit', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create collaboration status enum
DO $$ BEGIN
    CREATE TYPE collaboration_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content collaborations table
CREATE TABLE IF NOT EXISTS public.content_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level collaboration_permission NOT NULL DEFAULT 'view',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status collaboration_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, collaborator_id)
);

-- Content comments table
CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content versions table
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, version_number)
);

-- Enable RLS
ALTER TABLE public.content_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_collaborations
CREATE POLICY "Content owners and collaborators can view collaborations" ON public.content_collaborations
  FOR SELECT USING (
    collaborator_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_collaborations.content_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Content owners can manage collaborations" ON public.content_collaborations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_collaborations.content_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can accept/decline their own invitations" ON public.content_collaborations
  FOR UPDATE USING (collaborator_id = auth.uid());

-- RLS Policies for content_comments
CREATE POLICY "Collaborators can view comments" ON public.content_comments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_comments.content_id AND gc.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.content_collaborations cc
      WHERE cc.content_id = content_comments.content_id 
      AND cc.collaborator_id = auth.uid() 
      AND cc.status = 'accepted'
    )
  );

CREATE POLICY "Collaborators can add comments" ON public.content_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.generated_content gc
        WHERE gc.id = content_comments.content_id AND gc.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.content_collaborations cc
        WHERE cc.content_id = content_comments.content_id 
        AND cc.collaborator_id = auth.uid() 
        AND cc.status = 'accepted'
      )
    )
  );

-- RLS Policies for content_versions
CREATE POLICY "Collaborators can view versions" ON public.content_versions
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.generated_content gc
      WHERE gc.id = content_versions.content_id AND gc.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.content_collaborations cc
      WHERE cc.content_id = content_versions.content_id 
      AND cc.collaborator_id = auth.uid() 
      AND cc.status = 'accepted'
    )
  );

CREATE POLICY "Collaborators with edit permission can create versions" ON public.content_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.generated_content gc
        WHERE gc.id = content_versions.content_id AND gc.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.content_collaborations cc
        WHERE cc.content_id = content_versions.content_id 
        AND cc.collaborator_id = auth.uid() 
        AND cc.status = 'accepted'
        AND cc.permission_level IN ('edit', 'admin')
      )
    )
  );

-- Create indexes
CREATE INDEX idx_content_collaborations_content_id ON public.content_collaborations(content_id);
CREATE INDEX idx_content_collaborations_collaborator_id ON public.content_collaborations(collaborator_id);
CREATE INDEX idx_content_comments_content_id ON public.content_comments(content_id);
CREATE INDEX idx_content_comments_parent_id ON public.content_comments(parent_comment_id);
CREATE INDEX idx_content_versions_content_id ON public.content_versions(content_id);
CREATE INDEX idx_content_versions_version_number ON public.content_versions(content_id, version_number);

-- Function to automatically create version on content update
CREATE OR REPLACE FUNCTION public.create_content_version()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create versions on content updates
CREATE TRIGGER create_version_on_update
  BEFORE UPDATE ON public.generated_content
  FOR EACH ROW EXECUTE FUNCTION public.create_content_version();