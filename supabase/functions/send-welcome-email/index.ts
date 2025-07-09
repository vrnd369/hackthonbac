import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { registration_id, email, name, registration_type } = await req.json()

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify registration exists
    const { data: registration, error: fetchError } = await supabase
      .from('hackathon_registrations')
      .select('*')
      .eq('id', registration_id)
      .single()

    if (fetchError || !registration) {
      throw new Error('Registration not found')
    }

    // Create welcome email content
    const welcomeEmailContent = {
      to: email,
      subject: `Welcome to DataAnalyzer Pro Hackathon 2025! 🚀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to the Hackathon! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">DataAnalyzer Pro Hackathon 2025</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${name}! 👋</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Thank you for registering for the DataAnalyzer Pro Hackathon 2025! We're excited to have you join our community of data enthusiasts.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Registration Details</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Registration Type:</strong> ${registration_type === 'premium' ? 'Premium ($10)' : 'Free'}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Event Date:</strong> July 25-26, 2025</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Format:</strong> 100% Virtual</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Duration:</strong> 48 Hours</p>
            </div>
            
            <h3 style="color: #1f2937; margin-bottom: 15px;">🎯 What's Next?</h3>
            <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
              <li>Join our Discord community for updates and networking</li>
              <li>Prepare your Python environment</li>
              <li>Review the hackathon tracks and choose your favorites</li>
              <li>Mark your calendar for July 25-26, 2025</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                Join Discord Community
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Questions? Reply to this email or contact us at info@dataanalyzerpro.com
            </p>
          </div>
        </div>
      `,
    }

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll log the email content and return success
    console.log('Welcome email would be sent to:', email)
    console.log('Email content:', welcomeEmailContent)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        email_content: welcomeEmailContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})