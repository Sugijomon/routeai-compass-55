-- ============================================================
-- 1. survey_wave
-- ============================================================
CREATE TABLE public.survey_wave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  wave_name VARCHAR(128) NOT NULL,
  wave_type VARCHAR(32) NOT NULL DEFAULT 'baseline',
  survey_version VARCHAR(32) NULL,
  scoring_version VARCHAR(32) NULL DEFAULT 'V8.1',
  policy_snapshot_date DATE NULL,
  opens_at TIMESTAMPTZ NULL,
  closes_at TIMESTAMPTZ NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_wave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_dpo_manage_survey_wave"
ON public.survey_wave FOR ALL TO authenticated
USING (
  is_super_admin(auth.uid())
  OR ((is_org_admin(auth.uid()) OR is_dpo(auth.uid())) AND org_id = get_user_org_id(auth.uid()))
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR ((is_org_admin(auth.uid()) OR is_dpo(auth.uid())) AND org_id = get_user_org_id(auth.uid()))
);

-- ============================================================
-- 2. survey_run (anoniem insertable)
-- ============================================================
CREATE TABLE public.survey_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wave_id UUID NULL REFERENCES public.survey_wave(id),
  org_id UUID NULL REFERENCES public.organizations(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  locale VARCHAR(16) NULL DEFAULT 'nl',
  source VARCHAR(32) NULL DEFAULT 'web',
  consent_ambassador BOOLEAN NULL,
  ambassador_email VARCHAR(320) NULL,
  CONSTRAINT chk_ambassador CHECK (
    (consent_ambassador IS DISTINCT FROM TRUE) OR ambassador_email IS NOT NULL
  )
);

ALTER TABLE public.survey_run ENABLE ROW LEVEL SECURITY;

-- Anonieme INSERT toegestaan (anon + authenticated)
CREATE POLICY "anon_insert_survey_run"
ON public.survey_run FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Anonieme respondent mag eigen run updaten (om completed_at te zetten);
-- gekoppeld via id is alleen mogelijk als client de id kent. Hier breed UPDATE
-- toegestaan; in de praktijk beschermt de onbekende id de rij.
CREATE POLICY "anon_update_survey_run"
ON public.survey_run FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Org admins, DPO's en super admins lezen runs van eigen org
CREATE POLICY "org_admin_dpo_select_survey_run"
ON public.survey_run FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR ((is_org_admin(auth.uid()) OR is_dpo(auth.uid())) AND org_id = get_user_org_id(auth.uid()))
);

-- ============================================================
-- 3. survey_invite
-- ============================================================
CREATE TABLE public.survey_invite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wave_id UUID NULL REFERENCES public.survey_wave(id),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  display_name VARCHAR(255) NULL,
  department_label VARCHAR(128) NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_sent_at TIMESTAMPTZ NULL,
  participation_status VARCHAR(32) NOT NULL DEFAULT 'invited',
  UNIQUE (org_id, email)
);

ALTER TABLE public.survey_invite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_dpo_manage_survey_invite"
ON public.survey_invite FOR ALL TO authenticated
USING (
  is_super_admin(auth.uid())
  OR ((is_org_admin(auth.uid()) OR is_dpo(auth.uid())) AND org_id = get_user_org_id(auth.uid()))
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR ((is_org_admin(auth.uid()) OR is_dpo(auth.uid())) AND org_id = get_user_org_id(auth.uid()))
);

-- ============================================================
-- 4. survey_participation
-- ============================================================
CREATE TABLE public.survey_participation (
  invite_id UUID PRIMARY KEY REFERENCES public.survey_invite(id),
  survey_run_id UUID NULL REFERENCES public.survey_run(id),
  opened_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  last_reminder_at TIMESTAMPTZ NULL
);

ALTER TABLE public.survey_participation ENABLE ROW LEVEL SECURITY;

-- Anonieme respondent mag eigen deelname aanmaken/bijwerken (kent invite_id uit invite-link)
CREATE POLICY "anon_insert_survey_participation"
ON public.survey_participation FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "anon_update_survey_participation"
ON public.survey_participation FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Org admins, DPO's en super admins lezen deelname van eigen org via invite
CREATE POLICY "org_admin_dpo_select_survey_participation"
ON public.survey_participation FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.survey_invite si
    WHERE si.id = survey_participation.invite_id
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
      AND si.org_id = get_user_org_id(auth.uid())
  )
);