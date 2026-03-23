import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteUserRequest {
  email: string
  role: 'org_admin' | 'super_admin' | 'content_editor' | 'manager' | 'user' | 'dpo'
  orgId: string
  name?: string
  redirect_to?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify caller is super_admin or org_admin
    const callerId = claimsData.claims.sub as string
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)

    const isSuperAdmin = callerRoles?.some(r => r.role === 'super_admin')
    const isOrgAdmin = callerRoles?.some(r => r.role === 'org_admin')
    if (!isSuperAdmin && !isOrgAdmin) {
      return new Response(JSON.stringify({ error: 'Only admins can invite users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const body: InviteUserRequest = await req.json()
    const { email, role, orgId, name, redirect_to } = body

    if (!email || !role || !orgId) {
      return new Response(JSON.stringify({ error: 'email, role, and orgId are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Invite user via admin API
    const inviteOptions: Record<string, unknown> = {
      data: {
        org_id: orgId,
        role: role,
        full_name: name || email,
      },
    }

    if (redirect_to) {
      inviteOptions.redirectTo = redirect_to
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, inviteOptions)

    if (inviteError) {
      return new Response(JSON.stringify({ success: false, error: inviteError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const userId = inviteData.user.id

    // Update profile with correct org_id
    await supabaseAdmin
      .from('profiles')
      .update({ org_id: orgId, full_name: name || email })
      .eq('id', userId)

    // Remove any auto-assigned roles from trigger
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // Insert the primary role
    const rolesToInsert: { user_id: string; role: string; org_id: string }[] = [
      { user_id: userId, role, org_id: orgId },
    ]

    // If org_admin, also add 'user' role for additive roles
    if (role === 'org_admin') {
      rolesToInsert.push({ user_id: userId, role: 'user', org_id: orgId })
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert(rolesToInsert)

    if (roleError) {
      console.error('Role insert error:', roleError)
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: inviteData.user.email,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
