import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  full_name?: string
  role?: 'org_admin' | 'super_admin' | 'content_editor' | 'manager' | 'user'
  org_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body: CreateUserRequest = await req.json()
    const { 
      email, 
      password, 
      full_name = email, 
      role = 'user',
      org_id = '00000000-0000-0000-0000-000000000001' 
    } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create user with admin API (auto-confirms email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: authError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Update profile with correct org_id if different from default
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ org_id, full_name })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // First, remove any auto-assigned roles from trigger
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id)

    // Add the specified role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role,
        org_id
      })

    if (roleError) {
      console.error('Role insert error:', roleError)
    }

    // Verify the setup
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile,
        roles: roles?.map(r => r.role) || []
      }
    }, null, 2), {
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
