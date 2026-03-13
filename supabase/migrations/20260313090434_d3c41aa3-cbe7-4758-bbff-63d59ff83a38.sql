ALTER TABLE public.organizations
  ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'routeai'
  CHECK (plan_type IN ('shadow_only', 'routeai', 'both'));