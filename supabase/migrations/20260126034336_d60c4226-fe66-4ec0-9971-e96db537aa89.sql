-- PHASE 1B: Migrate existing roles and create helper functions

-- Step 1.2 - Migrate existing 'admin' roles to 'org_admin'
UPDATE public.user_roles 
SET role = 'org_admin'::app_role 
WHERE role = 'admin'::app_role;

-- Step 1.3 - Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  org_user_count INTEGER;
BEGIN
  -- Insert the profile with default org
  INSERT INTO public.profiles (id, email, full_name, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    org_id = COALESCE(profiles.org_id, default_org_id);
  
  -- Check if this is the first user in the organization
  SELECT COUNT(*) INTO org_user_count 
  FROM public.profiles 
  WHERE org_id = default_org_id;
  
  -- If first user in org, grant org_admin role (changed from 'admin')
  IF org_user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (NEW.id, 'org_admin', default_org_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 1.4 - Create role helper functions

-- Check if user is super admin (platform-wide access)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'super_admin'
  );
$$;

-- Check if user is org admin (organization governance)
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'org_admin'
  );
$$;

-- Check if user is manager (team oversight)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'manager'
  );
$$;

-- Check if user is content editor
CREATE OR REPLACE FUNCTION public.is_content_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'content_editor'
  );
$$;

-- Get user's primary role (for display purposes)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::TEXT 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1
      WHEN 'content_editor' THEN 2
      WHEN 'org_admin' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'moderator' THEN 5
      WHEN 'user' THEN 6
      ELSE 7
    END
  LIMIT 1;
$$;

-- Enhanced has_role function that gives super_admin universal access
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN TRUE
      ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    END;
$$;