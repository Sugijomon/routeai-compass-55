CREATE TABLE IF NOT EXISTS public.ref_department (
  code VARCHAR(64) PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL
);

ALTER TABLE public.ref_department ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_ref_department ON public.ref_department;
CREATE POLICY public_read_ref_department
  ON public.ref_department
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.ref_department (code, label, sort_order) VALUES
  ('it_data_development',     'IT, Data & Development',      1),
  ('marketing_communicatie',  'Marketing & Communicatie',    2),
  ('hr_recruitment',          'HR & Recruitment',            3),
  ('finance_legal',           'Finance & Legal',             4),
  ('sales_accountmanagement', 'Sales & Accountmanagement',   5),
  ('operations_support',      'Operations & Support',        6),
  ('directie_management',     'Directie & Management',       7),
  ('anders',                  'Anders',                      8)
ON CONFLICT (code) DO NOTHING;