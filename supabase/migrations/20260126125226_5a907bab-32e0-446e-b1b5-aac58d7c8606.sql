-- Add subscription and contact columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'test', 'suspended')),
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'basic' CHECK (subscription_type IN ('basic', 'premium', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS subscription_end_date DATE,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Update existing organization with default values
UPDATE public.organizations 
SET 
  status = 'active',
  subscription_type = 'premium',
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '1 year'
WHERE status IS NULL;

-- Drop and recreate the SELECT policy to allow super_admins to view all organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

CREATE POLICY "Users can view own org or super admin all"
ON public.organizations
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR id = get_user_org_id(auth.uid())
);