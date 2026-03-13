INSERT INTO public.user_roles (user_id, role, org_id)
SELECT ur.user_id, 'user'::app_role, ur.org_id
FROM public.user_roles ur
WHERE ur.role = 'org_admin'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur2
  WHERE ur2.user_id = ur.user_id
    AND ur2.role = 'user'
    AND ur2.org_id = ur.org_id
);