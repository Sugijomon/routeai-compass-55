
CREATE TYPE public.dpo_notification_type AS ENUM (
  'orange_route_new',
  'red_route_blocked',
  'incident_high',
  'reexam_required',
  'tool_discovery_pending'
);

CREATE TYPE public.dpo_notification_status AS ENUM (
  'pending',
  'seen',
  'actioned',
  'dismissed'
);

CREATE TABLE public.dpo_notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id),
  assessment_id  UUID REFERENCES public.assessments(id),
  type           public.dpo_notification_type NOT NULL,
  status         public.dpo_notification_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at        TIMESTAMPTZ,
  actioned_at    TIMESTAMPTZ,
  actioned_by    UUID REFERENCES public.profiles(id),
  notes          TEXT
);

CREATE INDEX idx_dpo_notif_org_id  ON public.dpo_notifications(org_id);
CREATE INDEX idx_dpo_notif_status  ON public.dpo_notifications(status);
CREATE INDEX idx_dpo_notif_created ON public.dpo_notifications(created_at DESC);

ALTER TABLE public.dpo_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_manage_notifications"
  ON public.dpo_notifications FOR ALL
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  )
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );
