-- Tools Catalog: Mutable org policy for tools
CREATE TABLE IF NOT EXISTS public.tools_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.tools_library(id) ON DELETE CASCADE,
  
  -- Org decisions
  is_enabled BOOLEAN DEFAULT false,
  
  -- Org-specific guidelines
  custom_guidelines TEXT,
  custom_risk_notes TEXT,
  custom_display_name TEXT,
  
  -- Procurement & Contract
  contract_reference TEXT,
  procurement_date DATE,
  contract_expiry_date DATE,
  procurement_contact TEXT,
  
  -- Cost & Usage tracking
  cost_center TEXT,
  usage_limits TEXT,
  monthly_cost DECIMAL(10,2),
  
  -- Access control
  allowed_roles TEXT[] DEFAULT '{user,manager,org_admin}',
  requires_approval BOOLEAN DEFAULT false,
  
  -- Customization
  custom_icon_url TEXT,
  display_priority INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(org_id, tool_id)
);

-- Enable RLS
ALTER TABLE public.tools_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using security definer functions to avoid recursion)
CREATE POLICY "Super admins manage all catalogs"
  ON public.tools_catalog FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Org admins manage own catalog"
  ON public.tools_catalog FOR ALL
  USING (
    (is_org_admin(auth.uid()) OR is_manager(auth.uid()))
    AND org_id = get_user_org_id(auth.uid())
  )
  WITH CHECK (
    (is_org_admin(auth.uid()) OR is_manager(auth.uid()))
    AND org_id = get_user_org_id(auth.uid())
  );

CREATE POLICY "Users view enabled tools in own org"
  ON public.tools_catalog FOR SELECT
  USING (
    is_enabled = true
    AND org_id = get_user_org_id(auth.uid())
  );

-- Indexes
CREATE INDEX idx_tools_catalog_org ON public.tools_catalog(org_id);
CREATE INDEX idx_tools_catalog_tool ON public.tools_catalog(tool_id);
CREATE INDEX idx_tools_catalog_enabled ON public.tools_catalog(is_enabled);
CREATE INDEX idx_tools_catalog_priority ON public.tools_catalog(display_priority);

-- Updated_at trigger
CREATE TRIGGER update_tools_catalog_updated_at
  BEFORE UPDATE ON public.tools_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();