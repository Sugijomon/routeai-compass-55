
-- Add missing columns to learning_catalog
ALTER TABLE public.learning_catalog
ADD COLUMN IF NOT EXISTS custom_completion_message text,
ADD COLUMN IF NOT EXISTS completion_reward_points integer DEFAULT 0;

-- Rename columns to match requested schema (if they exist with different names)
-- is_mandatory -> is_required (semantically the same, keeping existing name)
-- custom_intro -> custom_intro_text (keeping existing name for compatibility)
-- priority -> display_priority (keeping existing name)
-- custom_deadline -> deadline (keeping existing name)
-- custom_notes -> notes (keeping existing name)

-- Ensure is_enabled defaults to false
ALTER TABLE public.learning_catalog
ALTER COLUMN is_enabled SET DEFAULT false;

-- Drop existing RLS policies to recreate with proper logic
DROP POLICY IF EXISTS "Org admins manage own catalog" ON public.learning_catalog;
DROP POLICY IF EXISTS "Super admins manage all catalogs" ON public.learning_catalog;
DROP POLICY IF EXISTS "Users view own org catalog" ON public.learning_catalog;
DROP POLICY IF EXISTS "Managers manage own catalog" ON public.learning_catalog;

-- Recreate RLS policies with proper hierarchy
-- Super admin: full access
CREATE POLICY "Super admins manage all catalogs"
ON public.learning_catalog FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Org admin: manage own org only
CREATE POLICY "Org admins manage own org catalog"
ON public.learning_catalog FOR ALL
USING (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()))
WITH CHECK (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()));

-- Managers: manage own org catalog
CREATE POLICY "Managers manage own org catalog"
ON public.learning_catalog FOR ALL
USING (is_manager(auth.uid()) AND org_id = get_user_org_id(auth.uid()))
WITH CHECK (is_manager(auth.uid()) AND org_id = get_user_org_id(auth.uid()));

-- Users: view enabled items in own org only
CREATE POLICY "Users view enabled catalog items"
ON public.learning_catalog FOR SELECT
USING (is_enabled = true AND org_id = get_user_org_id(auth.uid()));

-- Add unique constraint if not exists
DO $$ BEGIN
  ALTER TABLE public.learning_catalog
  ADD CONSTRAINT unique_org_library_item UNIQUE (org_id, library_item_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_catalog_org_id ON public.learning_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_learning_catalog_library_item_id ON public.learning_catalog(library_item_id);
CREATE INDEX IF NOT EXISTS idx_learning_catalog_is_enabled ON public.learning_catalog(is_enabled);
CREATE INDEX IF NOT EXISTS idx_learning_catalog_priority ON public.learning_catalog(priority);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_learning_catalog_updated_at ON public.learning_catalog;
CREATE TRIGGER update_learning_catalog_updated_at
  BEFORE UPDATE ON public.learning_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
