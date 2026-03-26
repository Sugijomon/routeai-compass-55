
-- Tabel 1: model_typekaarten
CREATE TABLE public.model_typekaarten (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id          TEXT UNIQUE NOT NULL,
  display_name          TEXT NOT NULL,
  provider              TEXT NOT NULL,
  model_type            TEXT NOT NULL,
  gpai_designated       BOOLEAN DEFAULT false,
  systemic_risk         BOOLEAN DEFAULT false,
  eu_license_status     TEXT DEFAULT 'unknown',
  hosting_region        TEXT,
  data_storage_region   TEXT,
  trains_on_input       BOOLEAN DEFAULT false,
  dpa_available         BOOLEAN DEFAULT false,
  statutory_prohibitions JSONB DEFAULT '[]',
  contractual_restrictions JSONB DEFAULT '[]',
  typekaart_version     TEXT DEFAULT '1.0',
  last_verified_at      TIMESTAMPTZ,
  status                TEXT DEFAULT 'draft',
  created_by            UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger voor eu_license_status
CREATE OR REPLACE FUNCTION public.validate_model_typekaarten()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.eu_license_status IS NOT NULL AND NEW.eu_license_status NOT IN ('open', 'restricted', 'prohibited', 'unknown') THEN
    RAISE EXCEPTION 'eu_license_status must be one of: open, restricted, prohibited, unknown';
  END IF;
  IF NEW.status IS NOT NULL AND NEW.status NOT IN ('draft', 'published', 'deprecated') THEN
    RAISE EXCEPTION 'status must be one of: draft, published, deprecated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_model_typekaarten
  BEFORE INSERT OR UPDATE ON public.model_typekaarten
  FOR EACH ROW EXECUTE FUNCTION public.validate_model_typekaarten();

-- RLS voor model_typekaarten
ALTER TABLE public.model_typekaarten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_model_typekaarten"
  ON public.model_typekaarten
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "authenticated_read_published_model_typekaarten"
  ON public.model_typekaarten
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Tabel 2: model_typekaart_updates (audit log)
CREATE TABLE public.model_typekaart_updates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  typekaart_id      UUID NOT NULL REFERENCES public.model_typekaarten(id),
  field_name        TEXT NOT NULL,
  old_value         TEXT,
  new_value         TEXT,
  change_type       TEXT,
  source            TEXT,
  confidence        TEXT,
  approved_by       UUID REFERENCES public.profiles(id),
  approved_at       TIMESTAMPTZ,
  status            TEXT DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger voor model_typekaart_updates
CREATE OR REPLACE FUNCTION public.validate_model_typekaart_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.change_type IS NOT NULL AND NEW.change_type NOT IN ('major', 'minor', 'patch') THEN
    RAISE EXCEPTION 'change_type must be one of: major, minor, patch';
  END IF;
  IF NEW.confidence IS NOT NULL AND NEW.confidence NOT IN ('high', 'medium', 'low') THEN
    RAISE EXCEPTION 'confidence must be one of: high, medium, low';
  END IF;
  IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'status must be one of: pending, approved, rejected';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_model_typekaart_updates
  BEFORE INSERT OR UPDATE ON public.model_typekaart_updates
  FOR EACH ROW EXECUTE FUNCTION public.validate_model_typekaart_updates();

-- RLS voor model_typekaart_updates
ALTER TABLE public.model_typekaart_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_model_typekaart_updates"
  ON public.model_typekaart_updates
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Tabel 3: org_tools_catalog uitbreiden
ALTER TABLE public.org_tools_catalog
  ADD COLUMN IF NOT EXISTS override_data_storage TEXT,
  ADD COLUMN IF NOT EXISTS override_trains_on_input BOOLEAN,
  ADD COLUMN IF NOT EXISTS override_acknowledged_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS override_acknowledged_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_typekaarten_canonical ON public.model_typekaarten(canonical_id);
CREATE INDEX IF NOT EXISTS idx_model_typekaarten_status ON public.model_typekaarten(status);
CREATE INDEX IF NOT EXISTS idx_org_tools_catalog_typekaart ON public.org_tools_catalog(typekaart_id);
