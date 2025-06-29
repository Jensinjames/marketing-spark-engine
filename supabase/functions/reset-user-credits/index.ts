import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple validation function for UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        errors: [{ message: `Method ${req.method} Not Allowed` }] 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          errors: [{ message: 'Invalid JSON body' }] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId
    const { userId } = requestBody;
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          errors: [{ field: 'userId', message: 'Invalid user ID format' }] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin or super_admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      // Log unauthorized access attempt
      await supabaseClient.rpc('audit_sensitive_operation', {
        p_action: 'unauthorized_reset_credits_attempt',
        p_table_name: 'user_credits',
        p_new_values: { target_user_id: userId, attempted_by: user.id }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden: You must be an admin to reset credits' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the target user exists
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Target user not found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate next reset date (start of next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Reset credits for the specified user
    const { data, error } = await supabaseClient
      .from('user_credits')
      .update({ 
        credits_used: 0,
        reset_at: nextMonth.toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error resetting credits:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to reset credits' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the admin action
    await supabaseClient.rpc('audit_sensitive_operation', {
      p_action: 'admin_reset_credits',
      p_table_name: 'user_credits',
      p_record_id: userId,
      p_new_values: { 
        credits_used: 0, 
        reset_at: nextMonth.toISOString(), 
        admin_user_id: user.id,
        target_user_email: targetUser.email,
        target_user_name: targetUser.full_name
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...data,
          message: `Credits reset successfully for ${targetUser.full_name || targetUser.email}`
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});