import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Zod validation schemas
const sendInvitationSchema = z.object({
  team_id: z.string().uuid('Invalid team ID format'),
  emails: z.array(z.string().email('Invalid email format')).min(1, 'At least one email required').max(10, 'Maximum 10 emails allowed'),
  role: z.enum(['admin', 'editor', 'viewer'], { errorMap: () => ({ message: 'Role must be admin, editor, or viewer' }) }),
  message: z.string().optional().transform(val => val?.trim()).refine(val => !val || val.length <= 500, 'Message must be 500 characters or less')
})

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  INVITE_EMAILS: { max: 20, windowMs: 3600000 }, // 20 invitations per hour
  RESEND_CONFIRMATION: { max: 5, windowMs: 900000 }, // 5 resends per 15 minutes
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Get authenticated user
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const requestBody = await req.json()
    const validationResult = sendInvitationSchema.safeParse(requestBody)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { team_id, emails, role, message } = validationResult.data

    // Rate limiting check
    const clientIP = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown'
    const rateLimitKey = `${user.id}_${clientIP}_invite_emails`
    
    const { data: rateLimitCheck } = await supabaseClient
      .from('rate_limits')
      .select('attempts, window_start')
      .eq('user_id', user.id)
      .eq('action_type', 'send_invitation')
      .gte('window_start', new Date(Date.now() - RATE_LIMIT_CONFIG.INVITE_EMAILS.windowMs).toISOString())
      .single()

    if (rateLimitCheck && rateLimitCheck.attempts >= RATE_LIMIT_CONFIG.INVITE_EMAILS.max) {
      await supabaseClient.rpc('audit_sensitive_operation', {
        p_action: 'rate_limit_exceeded_team_invitation',
        p_table_name: 'team_invitations',
        p_new_values: { user_id: user.id, ip_address: clientIP, emails_attempted: emails.length }
      })
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is team admin or owner
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('is_team_admin', { team_uuid: team_id, uid: user.id })

    if (adminError || !adminCheck) {
      await supabaseClient.rpc('audit_sensitive_operation', {
        p_action: 'unauthorized_team_invitation_attempt',
        p_table_name: 'team_invitations',
        p_new_values: { team_id, user_id: user.id, emails: emails }
      })

      return new Response(
        JSON.stringify({ error: 'Forbidden: You must be a team admin or owner to send invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get team information
    const { data: teamData, error: teamError } = await supabaseClient
      .from('teams')
      .select('name')
      .eq('id', team_id)
      .single()

    if (teamError || !teamData) {
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for unsubscribed emails
    const { data: unsubscribed } = await supabaseClient
      .from('email_unsubscribes')
      .select('email')
      .in('email', emails)

    const unsubscribedEmails = unsubscribed?.map(u => u.email) || []
    const validEmails = emails.filter(email => !unsubscribedEmails.includes(email))

    if (validEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'All provided emails have unsubscribed from notifications',
          unsubscribed_emails: unsubscribedEmails
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []
    const errors = []

    // Process each email
    for (const email of validEmails) {
      let emailLog = null
      
      try {
        // Check if user already exists and is team member
        const { data: existingMember } = await supabaseClient
          .from('team_members')
          .select('id')
          .eq('team_id', team_id)
          .eq('profiles.email', email)
          .limit(1)

        if (existingMember && existingMember.length > 0) {
          errors.push({ email, error: 'User is already a team member' })
          continue
        }

        // Check for existing pending invitation
        const { data: existingInvitation } = await supabaseClient
          .from('team_invitations')
          .select('id, status')
          .eq('team_id', team_id)
          .eq('email', email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .limit(1)

        if (existingInvitation && existingInvitation.length > 0) {
          errors.push({ email, error: 'Pending invitation already exists' })
          continue
        }

        // Generate invitation token
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('generate_invitation_token')

        if (tokenError || !tokenData) {
          throw new Error('Failed to generate invitation token')
        }

        // Create invitation record
        const { data: invitation, error: invitationError } = await supabaseClient
          .from('team_invitations')
          .insert({
            team_id,
            email,
            role,
            invited_by: user.id,
            token: tokenData,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'pending'
          })
          .select()
          .single()

        if (invitationError) {
          throw new Error(`Failed to create invitation: ${invitationError.message}`)
        }

        // Create initial email delivery log
        const { data: emailLogData, error: emailLogError } = await supabaseClient
          .from('email_delivery_logs')
          .insert({
            invitation_id: invitation.id,
            recipient_email: email,
            email_type: 'team_invitation',
            status: 'queued',
            retry_count: 0,
            max_retries: 3
          })
          .select()
          .single()

        if (emailLogError) {
          console.error('Failed to create email log:', emailLogError)
        } else {
          emailLog = emailLogData
        }

        // Generate unsubscribe token
        const { data: unsubscribeToken } = await supabaseClient
          .rpc('generate_unsubscribe_token')

        // Send email via Resend
        const invitationUrl = `${req.headers.get('origin') || 'https://your-app.com'}/accept-invitation?token=${tokenData}`
        const unsubscribeUrl = `${req.headers.get('origin') || 'https://your-app.com'}/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`

        const emailPayload = {
          from: 'Marketing Spark Engine <invitations@marketingsparkengine.com>',
          to: [email],
          subject: `You've been invited to join ${teamData.name}`,
          html: generateInvitationEmailHTML({
            teamName: teamData.name,
            inviterName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'A team member',
            role,
            invitationUrl,
            unsubscribeUrl,
            customMessage: message
          }),
          text: generateInvitationEmailText({
            teamName: teamData.name,
            inviterName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'A team member',
            role,
            invitationUrl,
            unsubscribeUrl,
            customMessage: message
          })
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        })

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          throw new Error(`Email delivery failed: ${emailResult.message || 'Unknown error'}`)
        }

        // Update email delivery log
        if (emailLog) {
          await supabaseClient
            .from('email_delivery_logs')
            .update({
              status: 'sent',
              provider_message_id: emailResult.id,
              provider_response: emailResult,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailLog.id)
        }

        results.push({
          email,
          status: 'sent',
          invitation_id: invitation.id,
          expires_at: invitation.expires_at
        })

      } catch (error) {
        console.error(`Error processing email ${email}:`, error)
        errors.push({ email, error: error.message })

        // Update email delivery log with error
        if (emailLog) {
          await supabaseClient
            .from('email_delivery_logs')
            .update({
              status: 'failed',
              error_message: error.message,
              next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
              updated_at: new Date().toISOString()
            })
            .eq('id', emailLog.id)
        }
      }
    }

    // Update rate limiting
    await supabaseClient
      .from('rate_limits')
      .upsert({
        user_id: user.id,
        action_type: 'send_invitation',
        attempts: (rateLimitCheck?.attempts || 0) + validEmails.length,
        window_start: new Date().toISOString()
      })

    // Log successful operation
    await supabaseClient.rpc('audit_sensitive_operation', {
      p_action: 'team_invitations_sent',
      p_table_name: 'team_invitations',
      p_new_values: { 
        team_id, 
        sent_count: results.length, 
        error_count: errors.length,
        admin_user_id: user.id 
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        sent: results,
        errors: errors.length > 0 ? errors : undefined,
        unsubscribed_emails: unsubscribedEmails.length > 0 ? unsubscribedEmails : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Email template functions
function generateInvitationEmailHTML(params: {
  teamName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  unsubscribeUrl: string;
  customMessage?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - Marketing Spark Engine</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .invitation-card { background-color: #f8fafc; border-radius: 12px; padding: 30px; margin: 20px 0; border-left: 4px solid #7c3aed; }
    .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .role-badge { background-color: #7c3aed; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Marketing Spark Engine</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #1e293b; margin-top: 0;">You've been invited to join a team!</h2>
      
      <div class="invitation-card">
        <h3 style="color: #7c3aed; margin-top: 0;">Team: ${params.teamName}</h3>
        <p style="color: #475569; margin: 10px 0;"><strong>Invited by:</strong> ${params.inviterName}</p>
        <p style="color: #475569; margin: 10px 0;"><strong>Your role:</strong> <span class="role-badge">${params.role}</span></p>
        
        ${params.customMessage ? `
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h4 style="color: #374151; margin-top: 0;">Personal message:</h4>
          <p style="color: #6b7280; font-style: italic;">"${params.customMessage}"</p>
        </div>
        ` : ''}
      </div>
      
      <p style="color: #475569; line-height: 1.6;">
        You've been invited to join <strong>${params.teamName}</strong> on Marketing Spark Engine. 
        Click the button below to accept your invitation and start collaborating with your team.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.invitationUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
        This invitation will expire in 7 days. If you can't click the button above, 
        copy and paste this link into your browser: <br>
        <a href="${params.invitationUrl}" style="color: #7c3aed; word-break: break-all;">${params.invitationUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>
        © 2024 Marketing Spark Engine. All rights reserved.<br>
        <a href="${params.unsubscribeUrl}">Unsubscribe</a> from team invitations
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateInvitationEmailText(params: {
  teamName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  unsubscribeUrl: string;
  customMessage?: string;
}): string {
  return `
🚀 Marketing Spark Engine - Team Invitation

You've been invited to join ${params.teamName}!

Invited by: ${params.inviterName}
Your role: ${params.role}

${params.customMessage ? `Personal message: "${params.customMessage}"\n\n` : ''}

Accept your invitation by visiting:
${params.invitationUrl}

This invitation will expire in 7 days.

---
© 2024 Marketing Spark Engine
Unsubscribe: ${params.unsubscribeUrl}
  `.trim();
}