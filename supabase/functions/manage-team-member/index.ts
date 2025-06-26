
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, team_id, member_id, new_role, credits_limit } = await req.json()

    if (!team_id) {
      return new Response(
        JSON.stringify({ error: 'team_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is team admin or owner
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('is_team_admin', { team_uuid: team_id, uid: user.id })

    if (adminError || !adminCheck) {
      await supabaseClient.rpc('audit_sensitive_operation', {
        p_action: 'unauthorized_team_admin_action_attempt',
        p_table_name: 'team_members',
        p_new_values: { team_id, action, attempted_by: user.id }
      })

      return new Response(
        JSON.stringify({ error: 'Forbidden: You must be a team admin or owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result = null
    let auditAction = ''
    let auditData = {}

    switch (action) {
      case 'update_role':
        if (!member_id || !new_role) {
          return new Response(
            JSON.stringify({ error: 'member_id and new_role are required for role updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: roleUpdate, error: roleError } = await supabaseClient
          .from('team_members')
          .update({ role: new_role })
          .eq('id', member_id)
          .eq('team_id', team_id)
          .select()

        if (roleError) {
          console.error('Error updating role:', roleError)
          return new Response(
            JSON.stringify({ error: 'Failed to update member role' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        result = roleUpdate
        auditAction = 'team_member_role_updated'
        auditData = { member_id, new_role, team_id }
        break

      case 'update_credits':
        if (!member_id || credits_limit === undefined) {
          return new Response(
            JSON.stringify({ error: 'member_id and credits_limit are required for credit updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get member's user_id first
        const { data: memberData, error: memberError } = await supabaseClient
          .from('team_members')
          .select('user_id')
          .eq('id', member_id)
          .eq('team_id', team_id)
          .single()

        if (memberError || !memberData) {
          return new Response(
            JSON.stringify({ error: 'Member not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: creditUpdate, error: creditError } = await supabaseClient
          .from('user_credits')
          .update({ monthly_limit: credits_limit })
          .eq('user_id', memberData.user_id)
          .select()

        if (creditError) {
          console.error('Error updating credits:', creditError)
          return new Response(
            JSON.stringify({ error: 'Failed to update member credits' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        result = creditUpdate
        auditAction = 'team_member_credits_updated'
        auditData = { member_id, credits_limit, team_id, user_id: memberData.user_id }
        break

      case 'remove_member':
        if (!member_id) {
          return new Response(
            JSON.stringify({ error: 'member_id is required for member removal' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Cannot remove owner
        const { data: memberCheck, error: memberCheckError } = await supabaseClient
          .from('team_members')
          .select('role, user_id')
          .eq('id', member_id)
          .eq('team_id', team_id)
          .single()

        if (memberCheckError || !memberCheck) {
          return new Response(
            JSON.stringify({ error: 'Member not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (memberCheck.role === 'owner') {
          return new Response(
            JSON.stringify({ error: 'Cannot remove team owner' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: removeResult, error: removeError } = await supabaseClient
          .from('team_members')
          .delete()
          .eq('id', member_id)
          .eq('team_id', team_id)
          .select()

        if (removeError) {
          console.error('Error removing member:', removeError)
          return new Response(
            JSON.stringify({ error: 'Failed to remove member' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        result = removeResult
        auditAction = 'team_member_removed'
        auditData = { member_id, team_id, removed_user_id: memberCheck.user_id }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log the admin action
    await supabaseClient.rpc('audit_sensitive_operation', {
      p_action: auditAction,
      p_table_name: 'team_members',
      p_new_values: { ...auditData, admin_user_id: user.id, timestamp: new Date().toISOString() }
    })

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
