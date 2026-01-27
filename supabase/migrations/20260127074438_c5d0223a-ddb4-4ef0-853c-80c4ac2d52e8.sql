-- Add missing address and contact columns to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS bank_name TEXT;