
-- 1. Add is_active column to profiles
ALTER TABLE public.profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- 2. Drop existing UPDATE/ALL policies on profiles that need adjustment
-- First let's see what exists and add proper policies

-- Allow super_admin to update any profile (including is_active)
CREATE POLICY "super_admin_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Allow org_admin to update profiles within their org (including is_active)
CREATE POLICY "org_admin_update_org_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()))
WITH CHECK (is_org_admin(auth.uid()) AND org_id = get_user_org_id(auth.uid()));
