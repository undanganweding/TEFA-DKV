import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Server configuration error')
    }

    // Initialize regular client to verify caller identity and run RLS
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify caller is an Admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (profile.role !== 'Admin TEFA' && profile.role !== 'Kepala TEFA' && profile.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Requires Admin privileges' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Initialize Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { action } = body

    if (action === 'list') {
      // Execute the RPC to safely get all users with their auth data via Postgres
      const { data: mergedData, error: rpcErr } = await supabaseAdmin.rpc('get_all_users_admin')
      if (rpcErr) throw rpcErr

      return new Response(JSON.stringify({ success: true, data: mergedData }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } 
    else if (action === 'update_email') {
      const { targetUserId, newEmail } = body
      if (!targetUserId || !newEmail) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { email: newEmail, email_confirm: true })
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      return new Response(JSON.stringify({ success: true, message: 'Email updated successfully' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    else if (action === 'reset_password') {
      const { targetUserId, newPassword } = body
      if (!targetUserId || !newPassword || newPassword.length < 8) return new Response(JSON.stringify({ error: 'Invalid params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    else if (action === 'delete_user') {
      const { targetUserId } = body
      if (!targetUserId) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
      if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
