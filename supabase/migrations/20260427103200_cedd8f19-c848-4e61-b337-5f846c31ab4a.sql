-- 1. Voeg first_seen_at toe aan org_tools_catalog
ALTER TABLE public.org_tools_catalog
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now();

-- 2. Maak org_tool_policy tabel
CREATE TABLE public.org_tool_policy (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool_code VARCHAR(64) NOT NULL,
  org_policy_status_code VARCHAR(32) NOT NULL DEFAULT 'newly_discovered',
  eu_ai_act_flag_code VARCHAR(64) NOT NULL DEFAULT 'none',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  decided_by VARCHAR(128) NULL,
  decided_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  PRIMARY KEY (org_id, tool_code)
);

-- 3. Enable RLS
ALTER TABLE public.org_tool_policy ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
-- Org admins en super admins: volledige controle voor eigen org
CREATE POLICY "org_admin_manage_org_tool_policy"
ON public.org_tool_policy
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()))
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()))
);

-- DPO: SELECT op eigen org
CREATE POLICY "dpo_select_org_tool_policy"
ON public.org_tool_policy
FOR SELECT
TO authenticated
USING (
  is_dpo(auth.uid()) AND org_id = get_user_org_id(auth.uid())
);

-- DPO: UPDATE op eigen org
CREATE POLICY "dpo_update_org_tool_policy"
ON public.org_tool_policy
FOR UPDATE
TO authenticated
USING (
  is_dpo(auth.uid()) AND org_id = get_user_org_id(auth.uid())
)
WITH CHECK (
  is_dpo(auth.uid()) AND org_id = get_user_org_id(auth.uid())
);

-- Gewone gebruikers: SELECT op eigen org
CREATE POLICY "users_select_org_tool_policy"
ON public.org_tool_policy
FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id(auth.uid())
);