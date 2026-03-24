-- Scoreboard kolommen toevoegen aan organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS scoreboard_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS scoreboard_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scoreboard_config JSONB NOT NULL DEFAULT '{}';

-- Publieke leestoegang voor scoreboard
CREATE POLICY "public_scoreboard_read"
  ON public.organizations FOR SELECT
  TO anon
  USING (scoreboard_enabled = true AND scoreboard_slug IS NOT NULL);
