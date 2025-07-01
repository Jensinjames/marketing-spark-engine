import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  token: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { token }: AcceptInvitationRequest = await req.json();

    if (!token) {
      throw new Error('Missing invitation token');
    }

    // Get user's email to match with invitation
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Find and validate invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('email', userProfile.email)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) <= new Date()) {
      // Update invitation status to expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      throw new Error('Invitation has expired');
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember && existingMember.status === 'active') {
      // Update invitation status to accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Already a team member',
          team_id: invitation.team_id
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Get team information to check seat limits
    const { data: teamPlan, error: planError } = await supabase
      .from('teams')
      .select(`
        *,
        user_plans!teams_owner_id_fkey(team_seats)
      `)
      .eq('id', invitation.team_id)
      .single();

    if (planError || !teamPlan) {
      throw new Error('Team not found');
    }

    // Check team seat limits
    const { count: currentMemberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', invitation.team_id)
      .eq('status', 'active');

    const maxSeats = teamPlan.user_plans?.[0]?.team_seats || 1;
    
    if (currentMemberCount !== null && currentMemberCount >= maxSeats) {
      throw new Error('Team has reached maximum member limit');
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .upsert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
        status: 'active'
      });

    if (memberError) {
      throw new Error('Failed to add user to team');
    }

    // Update invitation status to accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to update invitation status:', updateError);
      // Don't fail the request for this
    }

    // Log the acceptance
    await supabase.rpc('log_security_event', {
      event_type: 'team_invitation_accepted',
      event_data: { 
        team_id: invitation.team_id, 
        user_id: user.id, 
        role: invitation.role,
        invitation_id: invitation.id
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully joined team',
        team_id: invitation.team_id,
        role: invitation.role
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Accept invitation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to accept invitation',
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});