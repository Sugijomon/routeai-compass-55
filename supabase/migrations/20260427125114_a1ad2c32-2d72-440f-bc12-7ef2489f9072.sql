
-- Allow anonymous + authenticated survey respondents to read the published platform tool catalog.
-- Only published, platform-level rows (org_id IS NULL) are exposed; org-private library items remain protected.
CREATE POLICY "anon_read_published_platform_tools"
ON public.tools_library
FOR SELECT
TO anon, authenticated
USING (status = 'published' AND org_id IS NULL);

-- Allow anonymous + authenticated survey respondents to read org_tool_policy snapshot fields.
-- Needed by the V8.1 toolpicker to compute org_policy_status_code_snapshot / eu_ai_act_flag_code_snapshot.
-- Snapshot fields are non-sensitive policy metadata and are scoped per org via the survey URL.
CREATE POLICY "anon_read_org_tool_policy"
ON public.org_tool_policy
FOR SELECT
TO anon, authenticated
USING (true);
