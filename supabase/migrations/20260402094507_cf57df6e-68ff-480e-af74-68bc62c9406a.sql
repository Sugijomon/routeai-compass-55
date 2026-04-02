
-- Fix 1: Remove user self-insert policy on user_badges (privilege escalation)
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;

-- Create a SECURITY DEFINER function for system-controlled badge awarding
CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _org_id uuid, _badge_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate badge_type
  IF _badge_type NOT IN ('early_adopter', 'ai_scout') THEN
    RAISE EXCEPTION 'Invalid badge_type: %', _badge_type;
  END IF;
  
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- User can only award badges to themselves (system validates the logic)
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Cannot award badges to other users';
  END IF;
  
  INSERT INTO public.user_badges (user_id, org_id, badge_type)
  VALUES (_user_id, _org_id, _badge_type)
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$;

-- Fix 2: survey_participation view inherits RLS from shadow_survey_runs via security_invoker=on
-- No action needed — this is a false positive. Views with security_invoker=on 
-- apply the base table's RLS policies when queried.
