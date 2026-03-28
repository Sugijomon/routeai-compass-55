CREATE TABLE public.passport_identity (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  org_description     TEXT,
  dpo_name            TEXT,
  dpo_email           TEXT,
  ai_policy_url       TEXT,
  governance_scope    TEXT,
  review_cycle        TEXT DEFAULT 'Jaarlijks',
  last_reviewed_at    DATE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.passport_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_manage_passport_identity"
  ON public.passport_identity FOR ALL TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  )
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );

CREATE TRIGGER passport_identity_updated_at
  BEFORE UPDATE ON public.passport_identity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();