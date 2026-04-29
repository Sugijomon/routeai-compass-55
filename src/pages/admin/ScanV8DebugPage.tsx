/**
 * Scan V8.1 Debug — verificatiepagina voor admin/DPO.
 *
 * Doel: per completed survey_run laten zien of alle V8.1-brontabellen
 * correct gevuld zijn. GEEN scoring, GEEN dashboarddesign, GEEN oude
 * tabellen. Alleen bouw-/debugcontrole.
 *
 * Route: /admin/scan-v8-debug
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RunRow = {
  id: string;
  org_id: string;
  completed_at: string | null;
};

type RunReport = {
  runId: string;
  completedAt: string | null;
  department: string | null;
  frequency: string | null;
  toolCount: number;
  toolAccountCount: number;
  dataTypeCount: number;
  hasMotivations: boolean;
  hasConcerns: boolean;
  hasSupport: boolean;
  hasProfile: boolean;
  hasPreferenceReasons: boolean;
  toolUseCaseCount: number;
  missing: string[];
};

async function buildReport(run: RunRow): Promise<RunReport> {
  const runId = run.id;

  const [
    profileRes,
    toolRes,
    toolUseCaseRes,
    toolAccountCountRes,
    dataTypeRes,
    motivationRes,
    prefReasonRes,
    concernRes,
    supportRes,
  ] = await Promise.all([
    supabase
      .from("survey_profile")
      .select("department_code, department_other_text, ai_frequency_code")
      .eq("survey_run_id", runId)
      .maybeSingle(),
    supabase
      .from("survey_tool")
      .select("id", { count: "exact" })
      .eq("survey_run_id", runId),
    // use_case telt via join: survey_tool_use_case heeft survey_tool_id, niet survey_run_id
    supabase
      .from("survey_tool_use_case")
      .select("id, survey_tool!inner(survey_run_id)", { count: "exact", head: true })
      .eq("survey_tool.survey_run_id", runId),
    supabase
      .from("survey_tool_account")
      .select("survey_tool_id, survey_tool!inner(survey_run_id)", {
        count: "exact",
        head: true,
      })
      .eq("survey_tool.survey_run_id", runId),
    supabase
      .from("survey_data_type")
      .select("id", { count: "exact", head: true })
      .eq("survey_run_id", runId),
    supabase
      .from("survey_motivation")
      .select("id", { count: "exact", head: true })
      .eq("survey_run_id", runId),
    supabase
      .from("survey_tool_preference_reason")
      .select("id", { count: "exact", head: true })
      .eq("survey_run_id", runId),
    supabase
      .from("survey_top_concern")
      .select("id", { count: "exact", head: true })
      .eq("survey_run_id", runId),
    supabase
      .from("survey_support_need")
      .select("id", { count: "exact", head: true })
      .eq("survey_run_id", runId),
  ]);

  const profile = profileRes.data ?? null;
  const department =
    profile?.department_other_text || profile?.department_code || null;
  const frequency = profile?.ai_frequency_code ?? null;

  const toolCount = toolRes.count ?? 0;
  const toolUseCaseCount = toolUseCaseRes.count ?? 0;
  const toolAccountCount = toolAccountCountRes.count ?? 0;
  const dataTypeCount = dataTypeRes.count ?? 0;
  const motivationCount = motivationRes.count ?? 0;
  const prefReasonCount = prefReasonRes.count ?? 0;
  const concernCount = concernRes.count ?? 0;
  const supportCount = supportRes.count ?? 0;

  const missing: string[] = [];
  if (!profile) missing.push("survey_profile ontbreekt");
  if (toolCount === 0) missing.push("geen tools");
  if (toolCount > 0 && toolUseCaseCount === 0) missing.push("geen tool use cases");
  if (toolCount > 0 && toolAccountCount < toolCount)
    missing.push(
      `accounttypes incompleet (${toolAccountCount}/${toolCount})`,
    );
  if (dataTypeCount === 0) missing.push("geen datatypes");
  if (motivationCount === 0) missing.push("geen motivations");
  if (prefReasonCount === 0) missing.push("geen tool_preference_reason");
  if (concernCount === 0) missing.push("geen top_concern");
  if (supportCount === 0) missing.push("geen support_need");
  if (!run.completed_at) missing.push("completed_at ontbreekt");

  return {
    runId,
    completedAt: run.completed_at,
    department,
    frequency,
    toolCount,
    toolUseCaseCount,
    toolAccountCount,
    dataTypeCount,
    hasMotivations: motivationCount > 0,
    hasConcerns: concernCount > 0,
    hasSupport: supportCount > 0,
    hasProfile: !!profile,
    hasPreferenceReasons: prefReasonCount > 0,
    missing,
  };
}

type OrgRow = { id: string; name: string };

export default function ScanV8DebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<RunReport[]>([]);
  const [runCount, setRunCount] = useState(0);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(25);
      const list = (data ?? []) as OrgRow[];
      setOrgs(list);
      // default: eerste org met "test" in naam, anders eerste
      const preferred =
        list.find((o) => /test/i.test(o.name)) ?? list[0] ?? null;
      if (preferred) setSelectedOrgId(preferred.id);
    })();
  }, []);

  const inviteUrl = selectedOrgId
    ? `${window.location.origin}/shadow-survey-v8?org=${selectedOrgId}`
    : "";

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // negeer
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: runs, error: runsError } = await supabase
          .from("survey_run")
          .select("id, org_id, completed_at")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(50);

        if (runsError) throw runsError;
        const runList = (runs ?? []) as RunRow[];
        if (cancelled) return;
        setRunCount(runList.length);

        const built: RunReport[] = [];
        for (const r of runList) {
          const rep = await buildReport(r);
          if (cancelled) return;
          built.push(rep);
        }
        if (!cancelled) setReports(built);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
        Scan V8.1 — data-verificatie (debug)
      </h1>
      <p style={{ color: "#555", marginBottom: 16, fontSize: 13 }}>
        Toont per completed <code>survey_run</code> of alle V8.1-brontabellen
        zijn gevuld. Geen scoring, geen risico-classificatie. Alleen bouw- en
        datacontrole.
      </p>

      {/* Tijdelijk: actieve survey-uitnodigingslink voor smoke test */}
      <div
        style={{
          background: "#eef6ff",
          border: "1px solid #b6d4fe",
          borderRadius: 6,
          padding: 12,
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          🚀 Smoke test — survey-uitnodigingslink
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ color: "#444" }}>Organisatie:</label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            style={{ padding: "4px 6px", fontSize: 13 }}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        {inviteUrl && (
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code
              style={{
                background: "#fff",
                border: "1px solid #cbd5e1",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
                wordBreak: "break-all",
                flex: "1 1 320px",
              }}
            >
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={copyInvite}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {copied ? "Gekopieerd ✓" : "Kopieer link"}
            </button>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "5px 10px",
                fontSize: 12,
                background: "#fff",
                color: "#1d4ed8",
                border: "1px solid #1d4ed8",
                borderRadius: 4,
                textDecoration: "none",
              }}
            >
              Open in nieuw tabblad ↗
            </a>
          </div>
        )}
      </div>

      {loading && <p>Bezig met laden…</p>}
      {error && (
        <pre
          style={{
            background: "#fee",
            color: "#900",
            padding: 12,
            borderRadius: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      )}

      {!loading && !error && (
        <>
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>{runCount}</strong> completed runs gevonden (max 50 getoond,
            nieuwste eerst).
          </p>

          {reports.length === 0 && (
            <p style={{ fontStyle: "italic", color: "#666" }}>
              Nog geen completed survey_run rijen.
            </p>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ background: "#f3f3f3", textAlign: "left" }}>
                  <th style={th}>completed_at</th>
                  <th style={th}>run_id</th>
                  <th style={th}>vakgebied</th>
                  <th style={th}>frequentie</th>
                  <th style={th}>tools</th>
                  <th style={th}>use cases</th>
                  <th style={th}>accounts</th>
                  <th style={th}>datatypes</th>
                  <th style={th}>motivations</th>
                  <th style={th}>concerns</th>
                  <th style={th}>support</th>
                  <th style={th}>pref_reasons</th>
                  <th style={th}>warnings</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const ok = r.missing.length === 0;
                  return (
                    <tr
                      key={r.runId}
                      style={{
                        borderTop: "1px solid #eee",
                        background: ok ? "transparent" : "#fffbe6",
                      }}
                    >
                      <td style={td}>
                        {r.completedAt
                          ? new Date(r.completedAt).toLocaleString("nl-NL")
                          : "—"}
                      </td>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>
                        {r.runId.slice(0, 8)}…
                      </td>
                      <td style={td}>{r.department ?? "—"}</td>
                      <td style={td}>{r.frequency ?? "—"}</td>
                      <td style={td}>{r.toolCount}</td>
                      <td style={td}>{r.toolUseCaseCount}</td>
                      <td style={td}>
                        {r.toolAccountCount}
                        {r.toolCount > 0 && (
                          <span style={{ color: "#888" }}>
                            {" "}
                            / {r.toolCount}
                          </span>
                        )}
                      </td>
                      <td style={td}>{r.dataTypeCount}</td>
                      <td style={td}>{badge(r.hasMotivations)}</td>
                      <td style={td}>{badge(r.hasConcerns)}</td>
                      <td style={td}>{badge(r.hasSupport)}</td>
                      <td style={td}>{badge(r.hasPreferenceReasons)}</td>
                      <td style={td}>
                        {r.missing.length === 0 ? (
                          <span style={{ color: "#0a0" }}>✓ compleet</span>
                        ) : (
                          <span style={{ color: "#b85c00" }}>
                            {r.missing.join(", ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "6px 8px",
  fontWeight: 600,
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "6px 8px",
  verticalAlign: "top",
};

function badge(ok: boolean) {
  return ok ? (
    <span style={{ color: "#0a0" }}>ja</span>
  ) : (
    <span style={{ color: "#c00" }}>nee</span>
  );
}
