
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.incident_dpo_action AS ENUM ('auto_handled', 'reviewed', 'intervention_planned', 'resolved');

CREATE TABLE public.incidents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES public.organizations(id),
  assessment_id       UUID REFERENCES public.assessments(id),
  reported_by         UUID NOT NULL REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  description         TEXT NOT NULL,
  severity            public.incident_severity NOT NULL,
  output_used         TEXT CHECK (output_used IN ('yes_unchecked', 'no_manual_check', 'yes_after_correction')),
  dpo_notified        BOOLEAN NOT NULL DEFAULT false,
  dpo_reviewed_at     TIMESTAMPTZ,
  dpo_notes           TEXT,
  dpo_action          public.incident_dpo_action,
  dpo_reviewed_by     UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_report_own_incident"
  ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "user_read_own_incidents"
  ON public.incidents FOR SELECT TO authenticated
  USING (reported_by = auth.uid());

CREATE POLICY "org_admin_manage_org_incidents"
  ON public.incidents FOR ALL TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  )
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );

CREATE INDEX idx_incidents_org ON public.incidents(org_id);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_incidents_created ON public.incidents(created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_dpo_on_incident()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.severity IN ('medium', 'high') THEN
    INSERT INTO public.dpo_notifications (org_id, type, status, notes)
    VALUES (NEW.org_id, 'incident_high', 'pending',
            CONCAT('Incident gemeld — ernst: ', NEW.severity::text, '. Beschrijving: ', left(NEW.description, 200)));
    UPDATE public.incidents SET dpo_notified = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dpo_on_incident
  AFTER INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.notify_dpo_on_incident();
