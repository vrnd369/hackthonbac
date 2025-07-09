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
    const profileData = await req.json()

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate required fields
    const requiredFields = [
      'registration_id', 'first_name', 'last_name', 'country', 
      'city', 'field_of_study', 'school_or_company', 'how_heard_about_us'
    ]
    
    for (const field of requiredFields) {
      if (!profileData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Check if registration exists and is valid
    const { data: registration, error: regError } = await supabase
      .from('hackathon_registrations')
      .select('id, email, name, registration_type, payment_status')
      .eq('id', profileData.registration_id)
      .single()

    if (regError || !registration) {
      throw new Error('Invalid registration ID')
    }

    // For premium registrations, ensure payment is completed
    if (registration.registration_type === 'premium' && registration.payment_status !== 'completed') {
      throw new Error('Payment must be completed before creating profile')
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('registration_id', profileData.registration_id)
      .single()

    if (existingProfile) {
      throw new Error('Profile already exists for this registration')
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        registration_id: profileData.registration_id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        date_of_birth: profileData.date_of_birth || null,
        gender: profileData.gender || null,
        phone_number: profileData.phone_number || null,
        country: profileData.country,
        city: profileData.city,
        field_of_study: profileData.field_of_study,
        school_or_company: profileData.school_or_company,
        current_position: profileData.current_position || null,
        how_heard_about_us: profileData.how_heard_about_us,
        profile_picture_url: profileData.profile_picture_url || null,
        bio: profileData.bio || null,
        linkedin_url: profileData.linkedin_url || null,
        github_url: profileData.github_url || null,
        portfolio_url: profileData.portfolio_url || null,
        skills: profileData.skills || [],
        interests: profileData.interests || [],
        profile_completed: true,
      }])
      .select()

    if (profileError) {
      throw profileError
    }

    // Update registration to mark profile as completed
    const { error: updateError } = await supabase
      .from('hackathon_registrations')
      .update({ 
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileData.registration_id)

    if (updateError) {
      console.error('Error updating registration:', updateError)
      // Don't throw here as profile was created successfully
    }

    // Send welcome email with profile information
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          registration_id: profileData.registration_id,
          email: registration.email,
          name: `${profileData.first_name} ${profileData.last_name}`,
          registration_type: registration.registration_type,
          profile_completed: true,
        }),
      })
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't throw here as profile creation was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile[0],
        message: 'Profile created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating user profile:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})