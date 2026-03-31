
-- 1. Tabel admin_audit_log
CREATE TABLE public.admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL,
  action      text NOT NULL,
  target_table text NOT NULL,
  target_id   uuid NOT NULL,
  target_user_id uuid,
  org_id      uuid,
  old_value   jsonb,
  new_value   jsonb,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index voor snelle queries
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_audit_log_org_id ON public.admin_audit_log (org_id);
CREATE INDEX idx_audit_log_actor_id ON public.admin_audit_log (actor_id);

-- 2. RLS inschakelen
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- INSERT: super_admin en org_admin
CREATE POLICY "admin_insert_audit_log"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()) OR is_org_admin(auth.uid()));

-- SELECT: super_admin alles, org_admin eigen org
CREATE POLICY "admin_select_audit_log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid())));

-- Geen UPDATE of DELETE policies → onveranderlijk

-- 3. Trigger-functie: log wijzigingen op user_roles
CREATE OR REPLACE FUNCTION public.audit_log_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, target_user_id, org_id, old_value, new_value)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'role.assign',
      'user_roles',
      NEW.id,
      NEW.user_id,
      NEW.org_id,
      NULL,
      jsonb_build_object('role', NEW.role::text, 'org_id', NEW.org_id::text)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, target_user_id, org_id, old_value, new_value)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'role.revoke',
      'user_roles',
      OLD.id,
      OLD.user_id,
      OLD.org_id,
      jsonb_build_object('role', OLD.role::text, 'org_id', OLD.org_id::text),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_user_roles();

-- 4. Trigger-functie: log is_active wijzigingen op profiles
CREATE OR REPLACE FUNCTION public.audit_log_profile_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, target_user_id, org_id, old_value, new_value)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      CASE WHEN NEW.is_active = false THEN 'user.deactivate' ELSE 'user.reactivate' END,
      'profiles',
      NEW.id,
      NEW.id,
      NEW.org_id,
      jsonb_build_object('is_active', OLD.is_active),
      jsonb_build_object('is_active', NEW.is_active)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_profile_active
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_profile_active();
