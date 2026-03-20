
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_badge_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.badge_type NOT IN ('early_adopter', 'ai_scout') THEN
    RAISE EXCEPTION 'badge_type must be one of: early_adopter, ai_scout';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_badge_type
  BEFORE INSERT OR UPDATE ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.validate_badge_type();

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_org_id ON public.user_badges(org_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read own badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Org admins can view all badges in their org
CREATE POLICY "Org admins view org badges"
  ON public.user_badges FOR SELECT
  USING (
    org_id = get_user_org_id(auth.uid())
    AND (is_org_admin(auth.uid()) OR is_super_admin(auth.uid()))
  );

-- Users can insert their own badges
CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
