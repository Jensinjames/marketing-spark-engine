import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTeamRequest {
  name: string;
  description?: string;
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

    const { name, description }: CreateTeamRequest = await req.json();

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Team name must be at least 2 characters');
    }

    if (name.trim().length > 50) {
      throw new Error('Team name must be less than 50 characters');
    }

    // Use the secure database function for team creation
    const { data: result, error: createError } = await supabase.rpc(
      'create_team_with_access_control',
      {
        p_team_name: name.trim(),
        p_description: description?.trim() || null
      }
    );

    if (createError) {
      console.error('Database function error:', createError);
      throw new Error('Failed to create team');
    }

    // Check if the function returned an error
    if (!result.success) {
      const statusCode = result.upgrade_required ? 402 : 
                        result.limit_reached ? 429 : 400;
      
      return new Response(
        JSON.stringify({
          error: result.error,
          upgrade_required: result.upgrade_required || false,
          limit_reached: result.limit_reached || false
        }),
        { 
          status: statusCode,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        team: {
          id: result.team_id,
          name: result.team_name
        },
        usage: {
          teams_used: result.teams_used,
          teams_limit: result.teams_limit
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Create team error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create team',
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