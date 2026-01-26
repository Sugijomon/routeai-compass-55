-- Tools Library: Immutable technical facts about AI tools
CREATE TABLE IF NOT EXISTS public.tools_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT,
  
  -- IMMUTABLE technical properties
  hosting_location TEXT,
  data_residency TEXT,
  gpai_status BOOLEAN DEFAULT false,
  model_type TEXT,
  
  -- Capabilities (what the tool can do)
  capabilities TEXT[] DEFAULT '{}',
  
  -- Vendor information
  vendor_privacy_policy_url TEXT,
  vendor_terms_url TEXT,
  vendor_website_url TEXT,
  api_available BOOLEAN DEFAULT false,
  contract_required BOOLEAN DEFAULT false,
  
  -- Classification
  category TEXT CHECK (category IN (
    'llm', 'image_gen', 'code_assistant', 'rag', 'analytics', 'other'
  )),
  
  -- Versioning & Status
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  
  -- Platform-wide or org-specific
  org_id UUID REFERENCES public.organizations(id) DEFAULT NULL,
  
  -- Authorship
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tools_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins manage all tools"
  ON public.tools_library FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Org admins view published tools"
  ON public.tools_library FOR SELECT
  USING (
    status = 'published' 
    AND (org_id IS NULL OR org_id = get_user_org_id(auth.uid()))
  );

CREATE POLICY "Users view published platform tools"
  ON public.tools_library FOR SELECT
  USING (
    status = 'published' 
    AND org_id IS NULL
  );

-- Indexes
CREATE INDEX idx_tools_library_status ON public.tools_library(status);
CREATE INDEX idx_tools_library_category ON public.tools_library(category);
CREATE INDEX idx_tools_library_org ON public.tools_library(org_id);
CREATE INDEX idx_tools_library_vendor ON public.tools_library(vendor);
CREATE INDEX idx_tools_library_gpai ON public.tools_library(gpai_status);

-- Updated_at trigger
CREATE TRIGGER update_tools_library_updated_at
  BEFORE UPDATE ON public.tools_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();