-- PHASE 2: Create Learning Library & Catalog Tables

-- Step 2.1 - Learning Library (Platform-wide content repository)
CREATE TABLE IF NOT EXISTS public.learning_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content metadata
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  
  -- Classification
  type TEXT NOT NULL CHECK (type IN (
    'rijbewijs_module',
    'microlearning',
    'assessment_template'
  )),
  
  -- Versioning & Status
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  
  -- Authorship
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Organization context (NULL = platform-wide)
  org_id UUID REFERENCES public.organizations(id) DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.learning_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_library
CREATE POLICY "Super admins manage all library content"
  ON public.learning_library FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Content editors manage library content"
  ON public.learning_library FOR ALL
  USING (is_content_editor(auth.uid()));

CREATE POLICY "Org admins view published library content"
  ON public.learning_library FOR SELECT
  USING (status = 'published' AND is_org_admin(auth.uid()));

CREATE POLICY "Users view published library content"
  ON public.learning_library FOR SELECT
  USING (status = 'published');

-- Indexes
CREATE INDEX idx_learning_library_status ON public.learning_library(status);
CREATE INDEX idx_learning_library_type ON public.learning_library(type);
CREATE INDEX idx_learning_library_org ON public.learning_library(org_id);

-- Trigger for updated_at
CREATE TRIGGER update_learning_library_updated_at
  BEFORE UPDATE ON public.learning_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 2.2 - Learning Catalog (Organization-specific configuration)
CREATE TABLE IF NOT EXISTS public.learning_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  library_item_id UUID NOT NULL REFERENCES public.learning_library(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT false,
  
  -- Customization
  custom_title TEXT,
  custom_intro TEXT,
  custom_notes TEXT,
  
  -- Assignment
  assigned_to_roles TEXT[],
  priority INTEGER DEFAULT 0,
  custom_deadline DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one catalog entry per library item per org
  UNIQUE(org_id, library_item_id)
);

-- Enable RLS
ALTER TABLE public.learning_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_catalog
CREATE POLICY "Super admins manage all catalogs"
  ON public.learning_catalog FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins manage own catalog"
  ON public.learning_catalog FOR ALL
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('org_admin', 'manager')
    )
  );

CREATE POLICY "Users view own org catalog"
  ON public.learning_catalog FOR SELECT
  USING (
    is_enabled = true
    AND org_id = get_user_org_id(auth.uid())
  );

-- Indexes
CREATE INDEX idx_learning_catalog_org ON public.learning_catalog(org_id);
CREATE INDEX idx_learning_catalog_library ON public.learning_catalog(library_item_id);
CREATE INDEX idx_learning_catalog_enabled ON public.learning_catalog(is_enabled);

-- Trigger for updated_at
CREATE TRIGGER update_learning_catalog_updated_at
  BEFORE UPDATE ON public.learning_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();