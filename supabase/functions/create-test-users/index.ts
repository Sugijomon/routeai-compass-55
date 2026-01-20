import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const testUsers = [
      { email: 'testuser1@test.com', password: 'testpass123' },
      { email: 'testuser2@test.com', password: 'testpass123' },
      { email: 'testuser3@test.com', password: 'testpass123' },
      { email: 'testuser4@test.com', password: 'testpass123' },
    ]

    const results = []

    for (const user of testUsers) {
      // Create user with admin API (auto-confirms email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
      })

      if (authError) {
        results.push({
          email: user.email,
          success: false,
          error: authError.message,
        })
        continue
      }

      // Profile is created automatically by trigger, but let's verify
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Check roles (should be none)
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)

      results.push({
        email: user.email,
        success: true,
        userId: authData.user.id,
        profile: profile ? 'created' : 'pending',
        roles: roles?.map(r => r.role) || [],
      })
    }

    return new Response(JSON.stringify({ results }, null, 2), {
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
