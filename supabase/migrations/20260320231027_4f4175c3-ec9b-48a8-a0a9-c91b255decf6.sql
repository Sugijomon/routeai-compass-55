
CREATE TABLE public.org_tools_catalog (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool_name    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'known_unconfigured',
  typekaart_id UUID,
  added_by     UUID,
  added_at     TIMESTAMPTZ DEFAULT now(),
  notes        TEXT,
  UNIQUE (org_id, tool_name)
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_org_tools_catalog_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('known_unconfigured', 'approved', 'under_review', 'not_approved') THEN
    RAISE EXCEPTION 'status must be one of: known_unconfigured, approved, under_review, not_approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_org_tools_catalog_status
  BEFORE INSERT OR UPDATE ON public.org_tools_catalog
  FOR EACH ROW EXECUTE FUNCTION public.validate_org_tools_catalog_status();

ALTER TABLE public.org_tools_catalog ENABLE ROW LEVEL SECURITY;

-- org_admin can manage own org
CREATE POLICY "org_admin_manage_org_tools_catalog"
  ON public.org_tools_catalog FOR ALL
  USING (
    (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
    AND org_id = get_user_org_id(auth.uid())
  )
  WITH CHECK (
    (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
    AND org_id = get_user_org_id(auth.uid())
  );

-- super_admin full access
CREATE POLICY "super_admin_full_org_tools_catalog"
  ON public.org_tools_catalog FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- users can read own org
CREATE POLICY "users_read_org_tools_catalog"
  ON public.org_tools_catalog FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE INDEX idx_org_tools_catalog_org_id ON public.org_tools_catalog(org_id);
