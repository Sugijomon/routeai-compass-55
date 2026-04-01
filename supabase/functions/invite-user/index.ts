import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  role: "org_admin" | "super_admin" | "content_editor" | "manager" | "user" | "dpo";
  orgId: string;
  name?: string;
  redirect_to?: string;
  email_subject?: string;
  email_body?: string;
}

// ---------- helpers ----------

function buildRedirectUrl(role: string, baseUrl: string): string {
  if (role === "dpo") return `${baseUrl}/admin/shadow`;
  if (role === "org_admin") return `${baseUrl}/admin`;
  return `${baseUrl}/shadow-survey`;
}

function buildEmailHtml(
  resolvedBody: string | undefined,
  inviteUrl: string,
  orgName: string,
): string {
  if (resolvedBody) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <p>${resolvedBody.replace(/\n/g, "<br>")}</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${inviteUrl}"
             style="background-color:#16a34a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
            Start de inventarisatie
          </a>
        </div>
        <p style="font-size:12px;color:#888;">
          Als je deze uitnodiging niet verwacht, kun je deze e-mail negeren.
        </p>
      </div>`;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <p>Je bent uitgenodigd voor ${orgName}.</p>
      <div style="margin:32px 0;text-align:center;">
        <a href="${inviteUrl}"
           style="background-color:#16a34a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          Accepteer uitnodiging
        </a>
      </div>
    </div>`;
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  fromAddress: string,
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY is niet geconfigureerd");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend fout (${res.status}): ${body}`);
  }
}

// ---------- authorization helpers ----------

async function verifyCaller(req: Request, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized" };
  }

  const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await callerClient.auth.getUser();
  if (error || !user) throw { status: 401, message: "Unauthorized" };
  return user;
}

async function checkCallerPermissions(
  supabaseAdmin: ReturnType<typeof createClient>,
  callerId: string,
  orgId: string,
  role: string,
) {
  const { data: callerRoles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId);

  const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
  const isOrgAdmin = callerRoles?.some((r) => r.role === "org_admin");
  const isDpo = callerRoles?.some((r) => r.role === "dpo");

  if (!isSuperAdmin && !isOrgAdmin && !isDpo) {
    throw { status: 403, message: "Only admins can invite users" };
  }

  // Org-check (super_admin mag alles)
  if (!isSuperAdmin) {
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("org_id")
      .eq("id", callerId)
      .single();

    if (!callerProfile || callerProfile.org_id !== orgId) {
      throw {
        status: 403,
        message: "Je kunt alleen gebruikers uitnodigen voor je eigen organisatie.",
      };
    }
  }

  // Rol-restrictie: org_admin/dpo mogen alleen user, manager, dpo toewijzen
  const ORG_ADMIN_ALLOWED_ROLES = ["user", "manager", "dpo"];
  if (!isSuperAdmin && !ORG_ADMIN_ALLOWED_ROLES.includes(role)) {
    throw {
      status: 403,
      message: `De rol '${role}' kan alleen door een platformbeheerder worden toegewezen.`,
    };
  }

  return { isSuperAdmin, callerRoles };
}

// ---------- template variable substitution ----------

function buildVariableSubstitutor(
  name: string | undefined,
  email: string,
  managerName: string,
  orgName: string,
  deadlineStr: string,
  dpoEmail: string,
) {
  const firstName = (name || email).split(" ")[0] || email;
  return (text: string): string =>
    text
      .replace(/\[voornaam\]/g, firstName)
      .replace(/\[manager_naam\]/g, managerName)
      .replace(/\[org_name\]/g, orgName)
      .replace(/\[deadline\]/g, deadlineStr)
      .replace(/\[dpo_email\]/g, dpoEmail);
}

// ---------- main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verifieer caller
    const callerUser = await verifyCaller(req, supabaseUrl);
    const callerId = callerUser.id;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Parse body
    const body: InviteUserRequest = await req.json();
    const { email, role, orgId, name, redirect_to, email_subject, email_body } = body;

    if (!email || !role || !orgId) {
      return new Response(JSON.stringify({ error: "email, role, and orgId are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 3. Autorisatie
    await checkCallerPermissions(supabaseAdmin, callerId, orgId, role);

    // 4. Org-info ophalen
    const { data: orgRecord } = await supabaseAdmin
      .from("organizations")
      .select("name, settings")
      .eq("id", orgId)
      .single();

    const orgName = orgRecord?.name || "Organisatie";
    const orgSettings = (orgRecord?.settings || {}) as Record<string, unknown>;

    // 5. Amnestie-deadline berekenen
    const amnestyActivatedAt = orgSettings.amnesty_activated_at
      ? new Date(orgSettings.amnesty_activated_at as string)
      : null;
    const amnestyValidDays = (orgSettings.amnesty_valid_days as number) || 30;
    const deadlineDate = amnestyActivatedAt
      ? new Date(amnestyActivatedAt.getTime() + amnestyValidDays * 86400000)
      : new Date(Date.now() + 30 * 86400000);
    const deadlineStr = deadlineDate.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 6. Caller-info voor variabelen
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", callerId)
      .single();

    const managerName =
      (orgSettings.amnesty_manager_name as string) ||
      callerProfile?.full_name ||
      "De organisatie";
    const dpoEmail = callerProfile?.email || "";

    // 7. Variabele-substitutie
    const substituteVars = buildVariableSubstitutor(
      name,
      email,
      managerName,
      orgName,
      deadlineStr,
      dpoEmail,
    );

    const resolvedSubject = email_subject ? substituteVars(email_subject) : undefined;
    const resolvedBody = email_body ? substituteVars(email_body) : undefined;

    // 8. Redirect URL bepalen
    const baseUrl = Deno.env.get("SITE_URL") ?? "https://routeai.nl";
    const redirectTo = redirect_to || buildRedirectUrl(role, baseUrl);

    // ──────────────────────────────────────────────
    // STAP 1: Genereer invite-link via generateLink
    // ──────────────────────────────────────────────
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: {
          org_id: orgId,
          role: role,
          full_name: name || email,
        },
      },
    });

    if (linkError) {
      return new Response(JSON.stringify({ success: false, error: linkError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const inviteUrl = linkData.properties.action_link;
    const userId = linkData.user.id;

    // ──────────────────────────────────────────────────
    // STAP 2: Stuur custom e-mail via Resend
    // ──────────────────────────────────────────────────
    const emailHtml = buildEmailHtml(resolvedBody, inviteUrl, orgName);
    const emailSubject = resolvedSubject ?? `Je bent uitgenodigd voor ${orgName}`;
    const fromAddress = `${orgName} <noreply@digidactics.nl>`;

    await sendEmailViaResend(email, emailSubject, emailHtml, fromAddress);

    // 9. Profiel bijwerken
    await supabaseAdmin
      .from("profiles")
      .update({ org_id: orgId, full_name: name || email })
      .eq("id", userId);

    // 10. Rollen toewijzen
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    const rolesToInsert: { user_id: string; role: string; org_id: string }[] = [
      { user_id: userId, role, org_id: orgId },
    ];

    if (role === "org_admin") {
      rolesToInsert.push({ user_id: userId, role: "user", org_id: orgId });
    }
    if (role === "dpo") {
      rolesToInsert.push({ user_id: userId, role: "user", org_id: orgId });
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert(rolesToInsert);
    if (roleError) {
      console.error("Role insert error:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email: linkData.user.email },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return new Response(JSON.stringify({ error: e.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: e.status,
      });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
