
CREATE TYPE public.assessment_route AS ENUM (
  'green', 'yellow', 'orange', 'red'
);

CREATE TYPE public.assessment_status AS ENUM (
  'active', 'paused', 'stopped', 'superseded'
);

CREATE TYPE public.routing_method AS ENUM (
  'deterministic', 'claude_assisted'
);

CREATE TABLE public.assessments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES public.organizations(id),
  created_by              UUID NOT NULL REFERENCES public.profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  tool_id                 UUID,
  tool_name_raw           TEXT NOT NULL,
  survey_answers          JSONB NOT NULL,
  route                   public.assessment_route NOT NULL,
  primary_archetype       TEXT NOT NULL,
  secondary_archetypes    TEXT[] DEFAULT '{}',
  archetype_refs          TEXT[] NOT NULL,
  escalation_refs         TEXT[] DEFAULT '{}',
  plain_language          TEXT NOT NULL,
  routing_method          public.routing_method NOT NULL DEFAULT 'deterministic',
  decision_version        TEXT NOT NULL,
  claude_input_hash       TEXT,
  reason_filtered         TEXT,
  dpia_required           BOOLEAN NOT NULL DEFAULT false,
  fria_required           BOOLEAN NOT NULL DEFAULT false,
  transparency_required   BOOLEAN NOT NULL DEFAULT false,
  transparency_template   TEXT,
  dpo_oversight_required  BOOLEAN NOT NULL DEFAULT false,
  user_instructions       TEXT[] DEFAULT '{}',
  dpo_instructions        TEXT[] DEFAULT '{}',
  status                  public.assessment_status NOT NULL DEFAULT 'active',
  reviewer_admin_id       UUID REFERENCES public.profiles(id),
  reviewed_at             TIMESTAMPTZ
);

CREATE INDEX idx_assessments_org_id     ON public.assessments(org_id);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);
CREATE INDEX idx_assessments_route      ON public.assessments(route);
CREATE INDEX idx_assessments_status     ON public.assessments(status);
CREATE INDEX idx_assessments_created_at ON public.assessments(created_at DESC);
CREATE INDEX idx_assessments_routing    ON public.assessments(routing_method);

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_read_own"
  ON public.assessments FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "employee_insert_with_rijbewijs"
  ON public.assessments FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND has_ai_rijbewijs = true
    )
  );

CREATE POLICY "org_admin_manage_org"
  ON public.assessments FOR ALL
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  )
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );
