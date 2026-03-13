
-- Shadow survey runs
CREATE TABLE public.shadow_survey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_version TEXT NOT NULL DEFAULT '1.0',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ai_maturity_score INTEGER CHECK (ai_maturity_score BETWEEN 1 AND 5),
  department TEXT,
  role_description TEXT,
  amnesty_acknowledged BOOLEAN DEFAULT false
);
ALTER TABLE public.shadow_survey_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own survey runs"
  ON public.shadow_survey_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own survey runs"
  ON public.shadow_survey_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all survey runs"
  ON public.shadow_survey_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Tool discoveries
CREATE TABLE public.tool_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  survey_run_id UUID REFERENCES public.shadow_survey_runs(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  vendor TEXT,
  use_case TEXT,
  use_frequency TEXT CHECK (use_frequency IN ('daily','weekly','monthly','occasionally')),
  data_types_used TEXT[],
  department TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected','more_info_requested')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  resulting_tool_id UUID REFERENCES public.tools_library(id)
);
ALTER TABLE public.tool_discoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own tool discoveries"
  ON public.tool_discoveries FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can view own tool discoveries"
  ON public.tool_discoveries FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "Admins can manage all tool discoveries"
  ON public.tool_discoveries FOR ALL
  USING (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Shadow survey reports
CREATE TABLE public.shadow_survey_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  survey_version TEXT NOT NULL DEFAULT '1.0',
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_to_routeai_at TIMESTAMPTZ,
  import_status TEXT DEFAULT 'not_imported'
    CHECK (import_status IN ('not_imported','imported','partial'))
);
ALTER TABLE public.shadow_survey_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage reports"
  ON public.shadow_survey_reports FOR ALL
  USING (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Indexes
CREATE INDEX idx_tool_discoveries_org ON public.tool_discoveries(org_id);
CREATE INDEX idx_tool_discoveries_status ON public.tool_discoveries(review_status);
CREATE INDEX idx_tool_discoveries_resulting_tool ON public.tool_discoveries(resulting_tool_id);
CREATE INDEX idx_shadow_survey_runs_org ON public.shadow_survey_runs(org_id);
