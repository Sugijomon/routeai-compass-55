CREATE TYPE public.org_notification_source AS ENUM (
  'scan_engine',
  'model_library',
  'system'
);

CREATE TYPE public.org_notification_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TABLE public.org_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source          public.org_notification_source NOT NULL,
  severity        public.org_notification_severity NOT NULL DEFAULT 'info',
  title           TEXT NOT NULL,
  body            TEXT,
  action_url      TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  read_by         UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ
);

ALTER TABLE public.org_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_manage_org_notifications"
  ON public.org_notifications FOR ALL
  TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()) OR is_dpo(auth.uid()))
  )
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );

CREATE INDEX idx_org_notifications_org ON public.org_notifications(org_id);
CREATE INDEX idx_org_notifications_unread ON public.org_notifications(org_id, is_read) WHERE is_read = false;
CREATE INDEX idx_org_notifications_created ON public.org_notifications(created_at DESC);