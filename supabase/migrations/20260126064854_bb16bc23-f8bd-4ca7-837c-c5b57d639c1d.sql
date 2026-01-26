
-- Drop existing RLS policies first (they reference status as text)
DROP POLICY IF EXISTS "Content editors manage library content" ON public.learning_library;
DROP POLICY IF EXISTS "Org admins view published library content" ON public.learning_library;
DROP POLICY IF EXISTS "Super admins manage all library content" ON public.learning_library;
DROP POLICY IF EXISTS "Users view published library content" ON public.learning_library;
DROP POLICY IF EXISTS "Managers view published library content" ON public.learning_library;

-- Create enums (if not exists)
DO $$ BEGIN
  CREATE TYPE public.learning_content_type AS ENUM ('course', 'module', 'assessment', 'document');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.learning_difficulty_level AS ENUM ('basic', 'intermediate', 'advanced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.learning_status AS ENUM ('draft', 'published', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns
ALTER TABLE public.learning_library
ADD COLUMN IF NOT EXISTS content_type learning_content_type,
ADD COLUMN IF NOT EXISTS difficulty_level learning_difficulty_level DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer,
ADD COLUMN IF NOT EXISTS learning_objectives text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS required_for_license text[] DEFAULT '{}';

-- Migrate 'type' text to content_type enum
UPDATE public.learning_library 
SET content_type = 
  CASE 
    WHEN type = 'course' THEN 'course'::learning_content_type
    WHEN type = 'module' THEN 'module'::learning_content_type
    WHEN type = 'assessment' THEN 'assessment'::learning_content_type
    WHEN type = 'document' THEN 'document'::learning_content_type
    ELSE 'module'::learning_content_type
  END
WHERE content_type IS NULL;

-- Set NOT NULL after migration
ALTER TABLE public.learning_library
ALTER COLUMN content_type SET NOT NULL;

-- Drop old 'type' column
ALTER TABLE public.learning_library DROP COLUMN IF EXISTS type;

-- Convert status text to enum using a temp column approach
ALTER TABLE public.learning_library ADD COLUMN IF NOT EXISTS status_new learning_status;

UPDATE public.learning_library
SET status_new = 
  CASE 
    WHEN status = 'published' THEN 'published'::learning_status
    WHEN status = 'deprecated' THEN 'deprecated'::learning_status
    ELSE 'draft'::learning_status
  END;

ALTER TABLE public.learning_library DROP COLUMN status;
ALTER TABLE public.learning_library RENAME COLUMN status_new TO status;
ALTER TABLE public.learning_library ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.learning_library ALTER COLUMN status SET DEFAULT 'draft'::learning_status;

-- Recreate RLS policies with proper role checks
CREATE POLICY "Super admins manage all library content"
ON public.learning_library FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Content editors manage library content"
ON public.learning_library FOR ALL
USING (is_content_editor(auth.uid()))
WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "Org admins view published library content"
ON public.learning_library FOR SELECT
USING (status = 'published'::learning_status AND is_org_admin(auth.uid()));

CREATE POLICY "Managers view published library content"
ON public.learning_library FOR SELECT
USING (status = 'published'::learning_status AND is_manager(auth.uid()));

CREATE POLICY "Users view published library content"
ON public.learning_library FOR SELECT
USING (status = 'published'::learning_status);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_library_status ON public.learning_library(status);
CREATE INDEX IF NOT EXISTS idx_learning_library_content_type ON public.learning_library(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_library_required_for_license ON public.learning_library USING GIN(required_for_license);
CREATE INDEX IF NOT EXISTS idx_learning_library_difficulty ON public.learning_library(difficulty_level);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_learning_library_updated_at ON public.learning_library;
CREATE TRIGGER update_learning_library_updated_at
  BEFORE UPDATE ON public.learning_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
