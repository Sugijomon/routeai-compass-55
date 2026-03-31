
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS has_set_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_password_dismissed boolean NOT NULL DEFAULT false;
