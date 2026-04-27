-- Frequentie
CREATE TABLE IF NOT EXISTS public.ref_ai_frequency (
  code VARCHAR(32) PRIMARY KEY, label VARCHAR(128) NOT NULL, sort_order INT NOT NULL
);

-- Non-use reden
CREATE TABLE IF NOT EXISTS public.ref_no_ai_reason (
  code VARCHAR(32) PRIMARY KEY, label VARCHAR(128) NOT NULL
);

-- Accounttype
CREATE TABLE IF NOT EXISTS public.ref_account_type (
  code VARCHAR(32) PRIMARY KEY, label VARCHAR(128) NOT NULL
);

-- Datatype
CREATE TABLE IF NOT EXISTS public.ref_data_type (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL, risk_level VARCHAR(16) NOT NULL DEFAULT 'low'
);

-- Use cases
CREATE TABLE IF NOT EXISTS public.ref_use_case (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL, use_case_base NUMERIC(5,2) NOT NULL DEFAULT 20
);

-- Contexten
CREATE TABLE IF NOT EXISTS public.ref_context (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL, context_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

-- Org policy status
CREATE TABLE IF NOT EXISTS public.ref_org_policy_status (
  code VARCHAR(32) PRIMARY KEY, label VARCHAR(128) NOT NULL, shadow_base NUMERIC(5,2) NOT NULL
);

-- EU AI Act flags
CREATE TABLE IF NOT EXISTS public.ref_eu_ai_act_flag (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL
);

-- Catalog beheerstatus
CREATE TABLE IF NOT EXISTS public.ref_catalog_beheerstatus (
  code VARCHAR(32) PRIMARY KEY, label VARCHAR(128) NOT NULL
);

-- Review triggers
CREATE TABLE IF NOT EXISTS public.ref_review_trigger (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL, description TEXT NULL
);

-- Governance flags
CREATE TABLE IF NOT EXISTS public.ref_governance_flag (
  code VARCHAR(64) PRIMARY KEY, label VARCHAR(128) NOT NULL
);

-- Enable RLS + read-only public policy on alle ref_ tabellen
DO $$
DECLARE
  t TEXT;
  ref_tables TEXT[] := ARRAY[
    'ref_ai_frequency','ref_no_ai_reason','ref_account_type','ref_data_type',
    'ref_use_case','ref_context','ref_org_policy_status','ref_eu_ai_act_flag',
    'ref_catalog_beheerstatus','ref_review_trigger','ref_governance_flag'
  ];
BEGIN
  FOREACH t IN ARRAY ref_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "public_read_%I" ON public.%I FOR SELECT TO anon, authenticated USING (true);', t, t);
  END LOOP;
END $$;