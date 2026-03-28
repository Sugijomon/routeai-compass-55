
-- assessment_ml_assignments
CREATE TABLE IF NOT EXISTS public.assessment_ml_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id),
  library_item_id   UUID NOT NULL REFERENCES public.learning_library(id),
  is_required       BOOLEAN NOT NULL DEFAULT true,
  context_card_text TEXT,
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, user_id)
);

ALTER TABLE public.assessment_ml_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_ml_assignments"
  ON public.assessment_ml_assignments FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "system_insert_ml_assignments"
  ON public.assessment_ml_assignments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "org_admin_read_org_ml_assignments"
  ON public.assessment_ml_assignments FOR SELECT
  TO authenticated
  USING (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()));

CREATE INDEX idx_ml_assignments_assessment ON public.assessment_ml_assignments(assessment_id);
CREATE INDEX idx_ml_assignments_user ON public.assessment_ml_assignments(user_id);

-- assessment_ml_completions
CREATE TABLE IF NOT EXISTS public.assessment_ml_completions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id),
  library_item_id   UUID NOT NULL REFERENCES public.learning_library(id),
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  module_version    TEXT,
  UNIQUE(assessment_id, user_id, library_item_id)
);

ALTER TABLE public.assessment_ml_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_ml_completions"
  ON public.assessment_ml_completions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "org_admin_read_org_ml_completions"
  ON public.assessment_ml_completions FOR SELECT
  TO authenticated
  USING (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()));

CREATE INDEX idx_ml_completions_assessment ON public.assessment_ml_completions(assessment_id);
CREATE INDEX idx_ml_completions_user ON public.assessment_ml_completions(user_id);

-- Fix archetype_ml_map constraint
ALTER TABLE public.archetype_ml_map
  DROP CONSTRAINT IF EXISTS archetype_ml_map_archetype_code_library_item_id_key;

ALTER TABLE public.archetype_ml_map
  ADD CONSTRAINT archetype_ml_map_archetype_code_key UNIQUE (archetype_code);
