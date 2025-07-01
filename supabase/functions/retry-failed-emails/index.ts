import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // This function is designed to be called by cron job or manual trigger
    // No user authentication required, but we validate the service key
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

    // Get failed emails that are eligible for retry
    const { data: failedEmails, error: fetchError } = await supabaseClient
      .rpc('get_failed_emails_for_retry')

    if (fetchError) {
      throw new Error(`Failed to fetch emails for retry: ${fetchError.message}`)
    }

    if (!failedEmails || failedEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No failed emails found for retry',
          processed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${failedEmails.length} failed emails for retry`)

    const results = {
      success: 0,
      failed: 0,
      maxRetriesExceeded: 0,
      errors: []
    }

    // Process each failed email
    for (const failedEmail of failedEmails) {
      try {
        // Calculate exponential backoff delay
        const baseDelay = 5 * 60 * 1000 // 5 minutes base
        const backoffDelay = baseDelay * Math.pow(2, failedEmail.retry_count)
        const maxDelay = 4 * 60 * 60 * 1000 // Max 4 hours
        const nextRetryDelay = Math.min(backoffDelay, maxDelay)

        // Check if email has exceeded max retries
        if (failedEmail.retry_count >= failedEmail.max_retries) {
          results.maxRetriesExceeded++
          
          // Mark as permanently failed
          await supabaseClient
            .from('email_delivery_logs')
            .update({
              status: 'failed',
              error_message: 'Max retries exceeded',
              updated_at: new Date().toISOString()
            })
            .eq('id', failedEmail.log_id)
            
          continue
        }

        // Get invitation details for email content
        const { data: invitation, error: invitationError } = await supabaseClient
          .from('team_invitations')
          .select(`
            *,
            teams:team_id(name),
            profiles:invited_by(email, raw_user_meta_data)
          `)
          .eq('id', failedEmail.invitation_id)
          .single()

        if (invitationError || !invitation) {
          throw new Error(`Failed to fetch invitation details: ${invitationError?.message}`)
        }

        // Generate unsubscribe token
        const { data: unsubscribeToken } = await supabaseClient
          .rpc('generate_unsubscribe_token')

        // Recreate email content
        const invitationUrl = `https://your-app.com/accept-invitation?token=${invitation.token}`
        const unsubscribeUrl = `https://your-app.com/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(failedEmail.recipient_email)}`

        const inviterName = invitation.profiles?.raw_user_meta_data?.full_name || 
                           invitation.profiles?.email?.split('@')[0] || 
                           'A team member'

        const emailPayload = {
          from: 'Marketing Spark Engine <invitations@marketingsparkengine.com>',
          to: [failedEmail.recipient_email],
          subject: `You've been invited to join ${invitation.teams.name}`,
          html: generateInvitationEmailHTML({
            teamName: invitation.teams.name,
            inviterName,
            role: invitation.role,
            invitationUrl,
            unsubscribeUrl
          }),
          text: generateInvitationEmailText({
            teamName: invitation.teams.name,
            inviterName,
            role: invitation.role,
            invitationUrl,
            unsubscribeUrl
          })
        }

        // Attempt to send email
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        })

        const emailResult = await emailResponse.json()

        if (emailResponse.ok) {
          // Success - update log
          await supabaseClient
            .from('email_delivery_logs')
            .update({
              status: 'sent',
              provider_message_id: emailResult.id,
              provider_response: emailResult,
              retry_count: failedEmail.retry_count + 1,
              next_retry_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', failedEmail.log_id)

          results.success++
          console.log(`Successfully resent email to ${failedEmail.recipient_email}`)

        } else {
          // Failed again - update for next retry
          const newRetryCount = failedEmail.retry_count + 1
          const nextRetryAt = new Date(Date.now() + nextRetryDelay).toISOString()

          await supabaseClient
            .from('email_delivery_logs')
            .update({
              status: 'failed',
              error_message: emailResult.message || 'Retry failed',
              retry_count: newRetryCount,
              next_retry_at: newRetryCount < failedEmail.max_retries ? nextRetryAt : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', failedEmail.log_id)

          results.failed++
          console.error(`Failed to resend email to ${failedEmail.recipient_email}: ${emailResult.message}`)
        }

      } catch (error) {
        console.error(`Error processing retry for email ${failedEmail.recipient_email}:`, error)
        results.errors.push({
          email: failedEmail.recipient_email,
          error: error.message
        })

        // Update with error
        await supabaseClient
          .from('email_delivery_logs')
          .update({
            status: 'failed',
            error_message: `Retry error: ${error.message}`,
            retry_count: failedEmail.retry_count + 1,
            next_retry_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Retry in 30 minutes on error
            updated_at: new Date().toISOString()
          })
          .eq('id', failedEmail.log_id)

        results.failed++
      }
    }

    // Clean up old rate limiting records
    await supabaseClient.rpc('cleanup_expired_rate_limits')

    console.log('Email retry processing completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        processed: failedEmails.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email retry function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Email template functions (simplified for retry)
function generateInvitationEmailHTML(params: {
  teamName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  unsubscribeUrl: string;
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
}): string {
  return `
🚀 Marketing Spark Engine - Team Invitation

You've been invited to join ${params.teamName}!

Invited by: ${params.inviterName}
Your role: ${params.role}

Accept your invitation by visiting:
${params.invitationUrl}

This invitation will expire in 7 days.

---
© 2024 Marketing Spark Engine
Unsubscribe: ${params.unsubscribeUrl}
  `.trim();
}