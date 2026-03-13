
-- Function to enforce max 2 org_admins per organization
CREATE OR REPLACE FUNCTION public.check_org_admin_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check when inserting/updating to org_admin role
  IF NEW.role = 'org_admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE org_id = NEW.org_id
      AND role = 'org_admin'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF admin_count >= 2 THEN
      RAISE EXCEPTION 'Een organisatie mag maximaal 2 AI Verantwoordelijken hebben.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to user_roles table
CREATE TRIGGER enforce_org_admin_limit
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_org_admin_limit();
